import { useCallback, useMemo, useState } from 'react'
import './App.css'
import 'flag-icons/css/flag-icons.min.css'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Select } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'

import bmc from './assets/bmc-logo-yellow.png'
import steam from './assets/Steam_icon_logo.svg.png'
import reddit from './assets/reddit-logo.png'
import github from './assets/github-mark-white.png'
import external from './assets/external-link.png'

import leagues from './../data/leagues.json'
import playersData from './../data/players_stat.json'

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const languages = [
  { id: 1, name: 'en', img: 'fi-gb-eng' },
  { id: 2, name: 'cn', img: 'fi-cn' },
  { id: 3, name: 'es', img: 'fi-es' },
  { id: 4, name: 'pt', img: 'fi-pt' },
  { id: 5, name: 'ua', img: 'fi-ua' },
  { id: 6, name: 'vn', img: 'fi-vn' },
  { id: 7, name: 'pl', img: 'fi-pl' },
  { id: 8, name: 'de', img: 'fi-de' },
]

// Role position -> which 3 stat "slots" (and which color group each slot
// pulls its options from) that role gets to pick.
const ROLE_SLOT_COLORS = {
  0: ['red', 'green', 'red'],
  1: ['red', 'blue', 'green'],
  2: ['blue', 'green', 'blue'],
}

const ROLE_NAME_KEYS = {
  0: 'roles.core',
  1: 'roles.mid',
  2: 'roles.support',
}

const SLOT_BACKGROUNDS = {
  red: 'bg-red-500/40',
  blue: 'bg-blue-500/40',
  green: 'bg-green-500/40',
}

// Stats that have no real data behind them yet get a generic explainer
// instead of the multiplier UI actually meaning anything.
const NO_DATA_STATS = new Set(['lotuses_grabbed', 'madstone_collected'])

const multipliers = {
  kills: 107,
  deaths: 195,
  creep_score: 3,
  gpm: 2,
  tower_kills: 352,
  obs_placed: 117,
  camps_stacked: 234,
  runes_grabbed: 141,
  watchers_taken: 147,
  smokes_used: 293,
  roshan_kills: 1172,
  teamfight_participation: 2124,
  stuns: 10,
  tormentor_kills: 879,
  courier_kills: 703,
  firstblood: 1934,
}

// Which raw stat keys live under which color group. This is also the single
// source of truth for what shows up in each slot's dropdown - previously the
// dropdown options were read from one specific player's ("Xm") tournament
// 19696 entry, which broke if that player/tournament ever disappeared from
// the data set.
const statGroups = {
  red: ['kills', 'deaths', 'creep_score', 'gpm', 'madstone_collected', 'tower_kills'],
  blue: ['obs_placed', 'camps_stacked', 'runes_grabbed', 'watchers_taken', 'smokes_used', 'lotuses_grabbed'],
  green: ['roshan_kills', 'teamfight_participation', 'stuns', 'courier_kills', 'tormentor_kills', 'firstblood'],
}

const STAT_TO_GROUP = Object.fromEntries(
  Object.entries(statGroups).flatMap(([group, statList]) => statList.map((stat) => [stat, group]))
)

const TABLE_STATS = Object.keys(multipliers)

// "Deaths" is scored inverted (fewer deaths = more points), off a fixed
// ceiling. Kept as a named constant instead of a magic number repeated in
// two different calculations.
const MAX_DEATH_SCORE = 1950

const ROLE_KEYS = Object.keys(ROLE_SLOT_COLORS) // ['0', '1', '2']

// ---------------------------------------------------------------------------
// Pure helpers (kept outside the component so they don't get recreated
// every render)
// ---------------------------------------------------------------------------

function averageOf(values) {
  if (!values || values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function scoreForStat(stat, avg, statMultiplier) {
  if (avg === null) return 0
  if (stat === 'deaths') return (MAX_DEATH_SCORE - avg * statMultiplier)
  return avg * statMultiplier
}

/** Aggregate a single stat for one player, across the selected tournaments. */
function getAggregatedStat(playerData, stat, selectedTournaments) {
  const group = STAT_TO_GROUP[stat]
  if (!group) return { avg: null }

  let total = 0
  let games = 0

  selectedTournaments.forEach((tournamentId) => {
    const values = playerData[tournamentId]?.stats?.[group]?.[stat] ?? []
    total += values.reduce((sum, v) => sum + v, 0)
    games += values.length
  })

  if (!games) return { avg: null }
  return { avg: total / games }
}

/** Ranks the best player pairs (grouped by team) for a given role. */
function rankPlayersForRole({ role, slotStats, slotMultipliers, selectedTournaments }) {
  const slotColors = ROLE_SLOT_COLORS[role]

  const players = Object.entries(playersData)
    .filter(([, info]) => info.general?.pos === Number(role))
    .map(([name, info]) => {
      const total = slotColors.reduce((sum, color, slotIdx) => {
        const stat = slotStats[slotIdx]
        if (!stat) return sum

        const userMultiplier = slotMultipliers[slotIdx] || 0
        const statMultiplier = multipliers[stat] ?? 1

        const allValues = selectedTournaments.flatMap(
          (tournamentId) => info[tournamentId]?.stats?.[color]?.[stat] ?? []
        )

        const avg = averageOf(allValues)
        return sum + scoreForStat(stat, avg, statMultiplier) * userMultiplier
      }, 0)

      return { name, total, teamLogo: info.general?.team_logo }
    })

  const groupedByTeam = Object.values(
    players.reduce((groups, player) => {
      const key = player.teamLogo ?? player.name
      if (!groups[key]) groups[key] = { teamLogo: player.teamLogo, players: [], total: 0 }
      groups[key].players.push(player)
      groups[key].total += player.total
      return groups
    }, {})
  )

  return groupedByTeam
    .map((group) => ({
      teamLogo: group.teamLogo,
      total: group.total / group.players.length,
      players: group.players,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 16)
}

// ---------------------------------------------------------------------------
// Small presentational components
// ---------------------------------------------------------------------------

function SocialLinks() {
  const links = [
    { href: 'https://buymeacoffee.com/nineteenqq', src: bmc, alt: 'Buy me a coffee' },
    { href: 'https://steamcommunity.com/id/doodlehateu/', src: steam, alt: 'Steam profile' },
    {
      href: 'https://www.reddit.com/r/DotA2/comments/1vcpcvr/update_fantasy_league_2026_calculator/',
      src: reddit,
      alt: 'Reddit thread',
    },
    { href: 'https://github.com/bydoodle/dota2fantasy', src: github, alt: 'GitHub repository' },
  ]

  return (
    <div className="flex justify-between gap-4">
      {links.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
          <img src={link.src} className="size-10 xl:size-12 rounded-full" alt={link.alt} />
        </a>
      ))}
    </div>
  )
}

function LanguageSwitcher({ selectedLanguage, onChange }) {
  return (
    <Listbox value={selectedLanguage} onChange={onChange}>
      <Label className="sr-only">Language</Label>
      <div className="relative mt-2">
        <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-gray-800/50 py-1.5 pr-2 pl-3 text-left text-white outline-1 -outline-offset-1 outline-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6">
          <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
            <span className={`size-5 shrink-0 fi ${selectedLanguage.img}`}></span>
            <span className="block truncate">{selectedLanguage.name.toUpperCase()}</span>
          </span>
          <ChevronUpDownIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-400 sm:size-4"
          />
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base outline-1 -outline-offset-1 outline-white/10 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
        >
          {languages.map((language) => (
            <ListboxOption
              key={language.id}
              value={language}
              className="group relative cursor-default py-2 pr-9 pl-3 text-white select-none data-focus:bg-indigo-500 data-focus:outline-hidden"
            >
              <div className="flex items-center">
                <span className={`size-5 shrink-0 fi ${language.img}`}></span>
                <span className="ml-3 block font-normal group-data-selected:font-semibold">
                  {language.name.toUpperCase()}
                </span>
              </div>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

function TournamentCard({ leagueId, leagueInfo, checked, onToggle, t }) {
  return (
    <div className="relative bg-pink-950 p-4 rounded-lg flex w-full flex-col">
      <article>
        <div className="flex items-center justify-between">
          <label htmlFor={leagueId} className="text-2xl font-bold">
            <input
              type="checkbox"
              id={leagueId}
              className="mr-2 size-5"
              checked={checked}
              onChange={onToggle}
            />
            {leagueInfo.short_name}
          </label>
          <a href={leagueInfo.link} target="_blank" rel="noopener noreferrer">
            <img src={external} alt={`${leagueInfo.name} on Liquipedia`} className="size-5 invert ml-4" />
          </a>
        </div>
        <p className="font-bold mt-2">
          {t('total-matches-parsed')} {leagueInfo.total_matches_parsed}
        </p>
      </article>
    </div>
  )
}

function StatSlot({ color, stat, multiplierValue, onStatChange, onMultiplierChange, t }) {
  const descriptionKey = stat === 'watchers_taken' ? 'watchers-taken-desc' : NO_DATA_STATS.has(stat) ? 'no-data-desc' : null

  return (
    <div className={`flex flex-col gap-2 ${SLOT_BACKGROUNDS[color]} rounded-md px-4 py-6`}>
      <div className="flex justify-between gap-2">
        <Select
          value={stat || ''}
          onChange={(e) => onStatChange(e.target.value)}
          className="w-[100%] p-1 rounded-sm text-black bg-white"
          aria-label="Stat"
        >
          <option value="">{t('none')}</option>
          {statGroups[color].map((statKey) => (
            <option key={statKey} value={statKey} title={statKey === 'watchers_taken' ? 'Watchers taken data ' : ''}>
              {t(statKey)}
            </option>
          ))}
        </Select>
        <input
          type="number"
          aria-label="Multiplier"
          className="bg-white w-[30%] text-black rounded-sm p-1 focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
          value={multiplierValue ?? ''}
          onChange={(e) => onMultiplierChange(Number(e.target.value))}
        />
      </div>
      {descriptionKey && <p className="flex items-start gap-2 font-light max-w-70 text-white/70">{t(descriptionKey)}</p>}
    </div>
  )
}

function RoleColumn({ role, selectedOption, setSelectedOption, selectedMultiplier, setSelectedMultiplier, rankings, t }) {
  const slotColors = ROLE_SLOT_COLORS[role]
  const baseIndex = Number(role) * 3

  const setSlotStat = (slotIdx, value) => {
    setSelectedOption((prev) => {
      const updated = [...prev]
      updated[baseIndex + slotIdx] = value
      return updated
    })
  }

  const setSlotMultiplier = (slotIdx, value) => {
    setSelectedMultiplier((prev) => {
      const updated = [...prev]
      updated[baseIndex + slotIdx] = value
      return updated
    })
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-gradient-to-b from-purple-900 rounded-md to-transparent">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
        <div className="w-[30%] text-center items-center flex justify-center flex-col h-full gap-6">
          <h2 className="text-center text-white text-5xl md:-rotate-90">{t(ROLE_NAME_KEYS[role])}</h2>
        </div>
        <div className="flex flex-col gap-2">
          {slotColors.map((color, slotIdx) => (
            <StatSlot
              key={slotIdx}
              color={color}
              stat={selectedOption[baseIndex + slotIdx]}
              multiplierValue={selectedMultiplier[baseIndex + slotIdx]}
              onStatChange={(value) => setSlotStat(slotIdx, value)}
              onMultiplierChange={(value) => setSlotMultiplier(slotIdx, value)}
              t={t}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <h6 className="text-white text-3xl my-4">{t('best-players')}</h6>
        <ul className="text-white flex flex-col w-full gap-x-8">
          {rankings.map(({ teamLogo, total, players }) => (
            <li key={teamLogo ?? players.map((p) => p.name).join('-')} className="whitespace-nowrap flex justify-between items-center gap-2">
              {teamLogo && <img src={teamLogo} alt="" className="w-6 h-6 object-contain" />}
              <span>{players.map((player) => player.name).join(' & ')}</span>
              <div className="h-[1px] w-full bg-white bg-opacity-20 self-end mb-1"></div>
              <span>{total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function RoleFilterCheckboxes({ selectedRoles, onToggle, t }) {
  return (
    <div className="flex flex-wrap gap-6 text-white py-4">
      {ROLE_KEYS.map((role) => (
        <label key={role} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedRoles.includes(Number(role))}
            value={role}
            onChange={onToggle}
            className="size-4"
          />
          {t(ROLE_NAME_KEYS[role])}
        </label>
      ))}
    </div>
  )
}

// Stays a plain top-level component: it doesn't need to know *how* sorting
// works, just that clicking a header should report which stat was clicked.
// The parent (App) owns the actual toggle-on/toggle-off logic and passes it
// down as `onStatClick`. That keeps StatsTable a stable component reference
// across renders (no remount-on-every-keystroke) and keeps the sort/filter
// logic in one place instead of duplicated in JSX event handlers.
function StatsTable({ rows, statFilter, onStatClick, t }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg mb-20">
      <table className="text-sm border-collapse" style={{ minWidth: '1500px' }}>
        <thead className="bg-gray-950">
          <tr>
            <th className="sticky left-0 z-20 bg-gray-950 min-w-50 px-2"></th>
            {TABLE_STATS.map((stat) => (
              <th
                key={stat}
                onClick={() => onStatClick(stat)}
                className={`h-16 min-w-[80px] px-2 align-bottom pb-2 text-center tabular-nums whitespace-nowrap cursor-pointer select-none hover:text-yellow-300 ${
                  stat === statFilter ? 'text-yellow-400' : ''
                }`}
                title={t('click-to-sort', 'Click to sort by this stat')}
              >
                <span className="inline-block">{t(stat)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 border border-white/10">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-neutral-900/60 group">
              <th className="sticky left-0 z-10 bg-gray-950 group-hover:bg-neutral-900 px-2 py-2 text-left whitespace-nowrap font-bold min-w-[170px]">
                <div className="flex items-center gap-2">
                  {row.teamLogo && <img src={row.teamLogo} alt="" className="w-5 h-5 object-contain shrink-0" />}
                  <span>{row.label}</span>
                </div>
              </th>
              {TABLE_STATS.map((stat) => (
                <td
                  key={stat}
                  className={`px-1 py-2 text-center tabular-nums font-light min-w-[80px] ${
                    stat === statFilter ? 'bg-yellow-400/10 font-semibold' : ''
                  }`}
                >
                  {row.values[stat]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PrefixesSection() {
  return (
    selectedTournaments.map((el) => (
      <span>
        {el}
      </span>
    ))
    // (ROLE_KEYS)
    //   .map((e) => 
    //   (<span className='text-16 text-white'>
    //     {e}
    //   </span>)
    // )
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [selectedOption, setSelectedOption] = useState(Array(9).fill(null))
  const [selectedMultiplier, setSelectedMultiplier] = useState(Array(9).fill(1))
  const [selectedTournaments, setSelectedTournaments] = useState(Object.keys(leagues))
  const [selectedRoles, setSelectedRoles] = useState([0, 1, 2])
  const [statFilter, setStatFilter] = useState('')
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages.find((lang) => lang.name === i18n.language) || languages[0]
  )

  const handleLanguageChange = useCallback((language) => {
    setSelectedLanguage(language)
    i18n.changeLanguage(language.name)
    localStorage.setItem('language', language.name)
  }, [i18n])

  const toggleTournament = useCallback((leagueId) => {
    setSelectedTournaments((prev) =>
      prev.includes(leagueId) ? prev.filter((id) => id !== leagueId) : [...prev, leagueId]
    )
  }, [])

  const handleRoleFilterChange = useCallback((e) => {
    const role = Number(e.target.value)
    setSelectedRoles((prev) => (e.target.checked ? [...prev, role] : prev.filter((item) => item !== role)))
  }, [])

  // Clicking the same stat header again clears the sort/filter; clicking a
  // different one switches to it.
  const handleStatClick = useCallback((stat) => {
    setStatFilter((prev) => (prev === stat ? '' : stat))
  }, [])

  // Best-players ranking per role, recomputed only when the inputs that
  // actually affect it change (previously this ran on every render,
  // including on unrelated state changes like the language switcher).
  const rankingsByRole = useMemo(() => {
    const result = {}
    ROLE_KEYS.forEach((role) => {
      const baseIndex = Number(role) * 3
      result[role] = rankPlayersForRole({
        role,
        slotStats: selectedOption.slice(baseIndex, baseIndex + 3),
        slotMultipliers: selectedMultiplier.slice(baseIndex, baseIndex + 3),
        selectedTournaments,
      })
    })
    return result
  }, [selectedOption, selectedMultiplier, selectedTournaments])

  // Raw stats table, also memoized instead of recomputing every stat for
  // every player on every render. Teammates (same pos + same team_logo)
  // are grouped into one row, same as the "best players" ranking above:
  // their per-stat values are summed and divided by the pair size instead
  // of showing each player as a separate row.
  const tableRows = useMemo(() => {
    const filtered = Object.entries(playersData).filter(([, pData]) => selectedRoles.includes(pData.general?.pos))

    const perPlayer = filtered.map(([player, pData]) => {
      const values = {}
      TABLE_STATS.forEach((stat) => {
        const { avg } = getAggregatedStat(pData, stat, selectedTournaments)
        const statMultiplier = multipliers[stat] ?? 1
        values[stat] = avg === null ? null : scoreForStat(stat, avg, statMultiplier)
      })
      return { player, pos: pData.general?.pos, teamLogo: pData.general?.team_logo, values }
    })

    const groups = perPlayer.reduce((acc, entry) => {
      const key = `${entry.pos}::${entry.teamLogo ?? entry.player}`
      if (!acc[key]) acc[key] = { pos: entry.pos, teamLogo: entry.teamLogo, players: [] }
      acc[key].players.push(entry)
      return acc
    }, {})

    return Object.values(groups).map((group) => {
      const values = {}
      TABLE_STATS.forEach((stat) => {
        const allMissing = group.players.every((p) => p.values[stat] === null)
        if (allMissing) {
          values[stat] = '-'
        } else {
          const sum = group.players.reduce((s, p) => s + (p.values[stat] ?? 0), 0)
          values[stat] = (sum / group.players.length).toFixed(2)
        }
      })
      return {
        key: `${group.pos}-${group.teamLogo ?? group.players.map((p) => p.player).join('-')}`,
        label: group.players.map((p) => p.player).join(' & '),
        teamLogo: group.teamLogo,
        values,
      }
    })
  }, [selectedRoles, selectedTournaments])

  // Lets the user click a stat column to rank the table by it: rows without
  // data for that stat are hidden, the rest are sorted best-first.
  const filteredTableRows = useMemo(() => {
    if (!statFilter) return tableRows
    return tableRows
      .filter((row) => row.values[statFilter] !== '-')
      .sort((a, b) => parseFloat(b.values[statFilter]) - parseFloat(a.values[statFilter]))
  }, [tableRows, statFilter])

  return (
    <div className="2xl:px-48 xl:px-36 lg:px-24 md:px-12 sm:px-8 px-4 relative w-full bg-gray-950 min-h-screen flex flex-col">
      <header className="flex justify-between py-6 items-center w-full">
        <SocialLinks />
        <h1 className="hidden 2xl:block 2xl:absolute 2xl:left-1/2 2xl:-translate-x-1/2">
          Fantasy League Calculator 2026
        </h1>
        <LanguageSwitcher selectedLanguage={selectedLanguage} onChange={handleLanguageChange} />
      </header>

      <hr className="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400" />

      <div className="flex justify-center items-center flex-col py-6">
        <h2>{t('select-tournaments')}</h2>
        <p className="mt-2 text-center">{t('select-tournaments-desc')}</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:flex w-full xl:justify-between mt-8 gap-2 lg:gap-4 pb-6">
        {Object.entries(leagues).map(([leagueId, leagueInfo]) => (
          <TournamentCard
            key={leagueId}
            leagueId={leagueId}
            leagueInfo={leagueInfo}
            checked={selectedTournaments.includes(leagueId)}
            onToggle={() => toggleTournament(leagueId)}
            t={t}
          />
        ))}
      </section>

      <hr className="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400" />

      <div className='flex justify-center items-center flex-col py-6'>
        <h2>{t('prefixes-suggestions')}</h2>
        <p className="mt-2 text-center">{t('prefixes-suggestions-desc')}</p>
      </div>
      <section className=''>
        {PrefixesSection()}
      </section>

      <hr className="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400" />

      <section className="relative w-full flex flex-col gap-4 items-center py-6">
        <h2 className="text-white font-bold text-5xl">{t('select-your-stats')}</h2>
        <p className="text-white text-center mt-2">
          {t('select-your-stats-desc')} <br />
          <span className="text-white/70">{t('select-your-stats-instruction')}</span>
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {ROLE_KEYS.map((role) => (
            <RoleColumn
              key={role}
              role={role}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              selectedMultiplier={selectedMultiplier}
              setSelectedMultiplier={setSelectedMultiplier}
              rankings={rankingsByRole[role]}
              t={t}
            />
          ))}
        </div>
      </section>

      <section>
        <RoleFilterCheckboxes selectedRoles={selectedRoles} onToggle={handleRoleFilterChange} t={t} />

        <StatsTable rows={filteredTableRows} statFilter={statFilter} onStatClick={handleStatClick} t={t} />
      </section>
    </div>
  )
}

export default App
