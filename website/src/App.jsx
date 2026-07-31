import { useState } from 'react'
import './App.css'
import "flag-icons/css/flag-icons.min.css";
import bmc from './assets/bmc-logo-yellow.png'
import steam from "./assets/Steam_icon_logo.svg.png"
import reddit from "./assets/reddit-logo.png"
import github from "./assets/github-mark-white.png"
import external from "./assets/external-link.png"
import "flag-icons/css/flag-icons.min.css";
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'
import leagues from './../data/leagues.json';
import { Select } from '@headlessui/react'
import data from './../data/players_stat.json';

const languages = [
  {
    id: 1,
    name: 'En',
    img:
      'fi-gb-eng',
  },
  {
    id: 2,
    name: 'Cn',
    img:
      'fi-cn',
  },
  {
    id: 3,
    name: 'Es',
    img:
      'fi-es',
  },
  {
    id: 4,
    name: 'Pt',
    img:
      'fi-pt',
  },
  {
    id: 5,
    name: 'Ua',
    img:
      'fi-ua',
  },
  {
    id: 6,
    name: 'Vn',
    img:
      'fi-vn',
  },
  {
    id: 7,
    name: 'Id',
    img:
      'fi-id',
  },
]

const roles = {
    0: ['red', 'green', 'red'],
    1: ['red', 'blue', 'green'],
    2: ['blue', 'green', 'blue']
  }

const backgrounds = {
  red: "bg-red-500/40",
  blue: "bg-blue-500/40",
  green: "bg-green-500/40",
};

const multipliers = {
    'kills': 107,
    'deaths': 195,
    'creep_score': 3,
    'gpm': 2,
    'madstone_collected': 13,
    'tower_kills': 352,
    'obs_placed': 117,
    'camps_stacked': 234,
    'runes_grabbed': 141,
    'watchers_taken': 147,
    'smokes_used': 293,
    'roshan_kills': 1172,
    'teamfight_participation': 2124,
    'stuns': 10,
    'tormentor_kills': 879,
    'courier_kills': 703,
    'firstblood': 1934
  }

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[3])
  const [selectedOption, setSelectedOption] = useState([null, null, null, null, null, null, null, null, null]);
  const [selectedMultiplier, setSelectedMultiplier] = useState([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const [selectedTournaments, setSelectedTournaments] = useState(Object.keys(leagues));

  const getPlayers = (role) => {
    const players = Object.entries(data)
      .filter(([name, info]) => info.general.pos === +role)
      .map(([name, info]) => {
        const total = roles[role]
          .map((color, idx) => {
            const stat = selectedOption[idx + role * 3]

            if (!stat) return 0

            const multiplier = selectedMultiplier[idx + role * 3]
            const statMultiplier = multipliers[stat] ?? 1

            const selectedLeagues = Object.entries(info)
              .filter(([leagueId]) =>
                selectedTournaments.includes(leagueId)
              )

            let allValues = []

            selectedLeagues.forEach(([leagueId, leagueData]) => {
              const leagueStats = leagueData?.stats[color]

              if (!leagueStats) return

              const arr = leagueStats[stat] ?? []

              allValues = [...allValues, ...arr]
            })

            if (allValues.length === 0) return 0

            const avg =
              allValues.reduce((sum, el) => sum + el, 0) /
              allValues.length

            if (stat === "deaths") {
              return (1950 - avg * statMultiplier) * multiplier
            }

            return avg * multiplier * statMultiplier
          })
          .reduce((a, b) => a + b, 0)

        return {
          name,
          total,
          teamLogo: info.general.team_logo
        }
      })

    // Группируем игроков одной команды на одной позиции
    const grouped = Object.values(
      players.reduce((groups, player) => {
        const key = player.teamLogo

        if (!groups[key]) {
          groups[key] = {
            teamLogo: player.teamLogo,
            players: [],
            total: 0
          }
        }

        groups[key].players.push(player)
        groups[key].total += player.total

        return groups
      }, {})
    )

    // Делим сумму статистики игроков на количество игроков
    return grouped
      .map(group => ({
        teamLogo: group.teamLogo,
        total: group.total / group.players.length,
        players: group.players
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 16)
  }

  return (
    <div className='2xl:px-48 xl:px-36 lg:px-24 md:px-12 sm:px-8 px-4 relative w-full bg-gray-950 min-h-screen flex flex-col'>
      <header className='flex justify-between py-6 items-center w-full'>
        <div className='flex justify-between gap-4'>
          <a href="https://buymeacoffee.com/nineteenqq" target='_blank' rel="noopener noreferrer">
            <img src={bmc} className='size-10 xl:size-12 rounded-full' alt="Buy me a coffee"/>
          </a>
          <a href="https://steamcommunity.com/id/doodlehateu/" target='_blank' rel="noopener noreferrer">
            <img src={steam} className='size-10 xl:size-12 rounded-full' alt="Steam"/>
          </a>
          <a href="https://www.reddit.com/r/DotA2/comments/1vbt4z3/fantasy_calculator_2026/" target='_blank' rel="noopener noreferrer">
            <img src={reddit} className='size-10 xl:size-12 rounded-full' alt="Reddit"/>
          </a>
          <a href="https://github.com/bydoodle/dota2fantasy" target="_blank" rel="noopener noreferrer">
            <img src={github} className="size-10 xl:size-12 rounded-full" alt="" />
          </a>
        </div>
        <h1 className='hidden 2xl:block 2xl:absolute 2xl:left-1/2 2xl:-translate-x-1/2'>
          Fantasy League Calculator 2026
        </h1>
        {/* <Listbox value={selectedLanguage} onChange={setSelectedLanguage}>
          <Label className="block text-sm/6 font-medium text-white"></Label>
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
                    <span class={`size-5 shrink-0 fi ${language.img}`}></span>
                    <span className="ml-3 block font-normal group-data-selectedLanguage:font-semibold">{language.name.toUpperCase()}</span>
                  </div>

                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-400 group-not-data-selectedLanguage:hidden group-data-focus:text-white">
                    <CheckIcon aria-hidden="true" className="size-5" />
                  </span>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox> */}
      </header>
      <hr className="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400" />
      <div className='flex justidy-center items-center flex-col py-6'>
        <h2>Select tournaments</h2>
        <p className='mt-2'>Choose tournaments you want to fetch data from</p>
      </div>
      <section className='grid grid-cols-1 sm:grid-cols-2 xl:flex w-full xl:justify-between mt-8 gap-2 lg:gap-4 pb-6'>
        {Object.entries(leagues).map(([league, data]) => (
          <div key={league} className='relative bg-pink-950 p-4 rounded-lg flex w-full flex-col'>
            <article>
              <div className='flex items-center justify-between'>
                <label htmlFor={league} className='text-2xl font-bold'>
                  <input type="checkbox" name="" id={league} className='mr-2 size-5' checked={selectedTournaments.includes(league)} onChange={() =>
                    setSelectedTournaments(prev =>
                      prev.includes(league)
                        ? prev.filter(id => id !== league)
                        : [...prev, league]
                    )
                  } />
                  {data.short_name}
                </label>
                <a href={data.link} target='_blank' rel="noopener noreferrer">
                  <img src={external} alt="" className='size-5 invert ml-4' />
                </a>
              </div>
              <p className='font-bold mt-2'>Total matches parsed: {data.total_matches_parsed}</p>
            </article>
          </div>
        ))}
      </section>
      <hr className="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400" />
      <section className='relative w-full flex flex-col gap-4 items-center py-6'>
        <h2 className='text-white font-bold text-5xl'>Select your stats</h2>
        <p className='text-white text-center mt-2'>Choose your stats and their multipliers <br /><span className='text-white/70'>* Enter fraction instead of percents, for example if you have 270% multiplier enter 2.7 instead.</span></p>
        {/* <button className='text-yellow-500 text-2xl absolute right-0 top-12 cursor-pointer' onClick={() => setIsHIW(true)}>How does it counts?</button> */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
          {Object.keys(roles).map((role, index) => (
            <div
            key={role}
            className='flex flex-col gap-2 p-4 bg-gradient-to-b from-purple-900 rounded-md to-transparent'>
              <div className='flex flex-col md:flex-row justify-between items-center md:items-start gap-4'>
                <div className='w-[40%] flex flex-col mt-6 gap-6'>
                  <h2 className='text-center text-white text-5xl'>{{0: 'Core', 1: 'Mid', 2: 'Support'}[role]}</h2>
                </div>
                <div className='flex flex-col gap-2'>
                {roles[role].map((color, idx) => (
                  <div
                  key={idx}
                  className={`flex justify-between gap-2 ${backgrounds[color]} rounded-md px-4 py-6`}
                  >
                    <Select
                    value={selectedOption[idx + (role * 3)] || ''}
                    onChange={(e) => setSelectedOption(prev => {
                      const updated = [...prev];
                      updated[idx + (role * 3)] = e.target.value;
                      return updated;
                    })}
                    className='w-[100%] p-1 rounded-sm text-black bg-white'
                    >
                      <option value="">None</option>
                      {Object.keys(data.Xm[19696].stats[color]).map((stat, idx) => (
                        <option key={`${idx}-${stat}`} value={stat || ''}>
                          {stat.replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                      <input
                    type="number"
                    className='bg-white w-[30%] text-black rounded-sm p-1 focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]'
                    value={selectedMultiplier[idx + (role * 3)] || ''} 
                    onChange={(e) =>
                      setSelectedMultiplier(prev => {
                        const updated = [...prev];
                        updated[idx + (role * 3)] = Number(e.target.value);
                        return updated;
                      })
                    } />
                  </div>
                ))}
                </div>
              </div>
              <div className='flex flex-col items-center'>
                <h6 className="text-white text-3xl my-4">Best players:</h6>
                <ul className='text-white flex flex-col w-full gap-x-8'>
                  {getPlayers(role).map(({ teamLogo, total, players }) => (
                    <li
                      key={teamLogo}
                      className="whitespace-nowrap flex justify-between items-center gap-2"
                    >
                      <img
                        src={teamLogo}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />

                      <span>
                        {players.map(player => player.name).join(" + ")}
                      </span>

                      <div className="h-[1px] w-full bg-white bg-opacity-20 self-end mb-1"></div>

                      <span>{total.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
