import requests
import json
import time
import os
from collections import Counter

PLAYERS_LIST = {
# # Aurora Gaming
    'Nightfall': {
        'pos': 0
    },
    'Mikoto': {
        'pos': 1
    },
    'Ws`': {
        'pos': 0
    },
    'Mira': {
        'pos': 2
    },
    'kaori': {
        'pos': 2
    },
# # BoomBoys
    'Kiritych~': {
        'pos': 0
    },
    'gpk~': {
        'pos': 1
    },
    'MieRo': {
        'pos': 0
    },
    'Save-': {
        'pos': 2
    },
    'Kataomi`': {
        'pos': 2
    },
# # 1w Team
    'Pure': {
        'pos': 0
    },
    'bzm': {
        'pos': 1
    },
    '33': {
        'pos': 0
    },
    'Ari': {
        'pos': 2
    },
    'Whitemon': {
        'pos': 2
    },
# # Team Falcons
    'skiter': {
        'pos': 0
    },
    'Malr1ne': {
        'pos': 1
    },
    'AMMAR_THE_F': {
        'pos': 0
    },
    'Cr1t-': {
        'pos': 2
    },
    'Sneyking': {
        'pos': 2
    },
# # Team Liquid
    'm1CKe': {
        'pos': 0
    },
    'Nisha': {
        'pos': 1
    },
    'Ace ♠': {
        'pos': 0
    },
    'Saksa': {
        'pos': 2
    },
    'Boxi': {
        'pos': 2
    },
    'tOfu': {
        'pos': 2
    },
# # Team Yandex
    '医者watson`': {
        'pos': 0
    },
    'CHIRA_JUNIOR': {
        'pos': 1
    },
    'DM': {
        'pos': 0
    },
    'Maladych': {
        'pos': 2
    },
    'Saksa': {
        'pos': 2
    },
# # Xtreme Gaming
    'Ame': {
        'pos': 0
    },
    'NothingToSay': {
        'pos': 1
    },
    'Xxs': {
        'pos': 0
    },
    'fy': {
        'pos': 2
    },
    'xNova': {
        'pos': 2
    },
# # Team Spirit
    "Yatoro": {
        'pos': 0
    },
    "Larl": {
        'pos': 1
    },
    "Collapse": {
        'pos': 0
    },
    "not_me": {
        'pos': 2
    },
    "rue": {
        'pos': 2
    },
# # Team Vision
    'Satanic': {
        'pos': 0
    },
    'No[o]ne-': {
        'pos': 1
    },
    'Noticed': {
        'pos': 0
    },
    '9Class': {
        'pos': 2
    },
    'Dukalis': {
        'pos': 2
    },
# # Nigma Galaxy
    'SumaiL-': {
        'pos': 0
    },
    'lorenof': {
        'pos': 1
    },
    'Davai': {
        'pos': 0
    },
    'OmaR': {
        'pos': 2
    },
    'GH': {
        'pos': 2
    },
# # HULIGANI
    'ssnovv1': {
        'pos': 0
    },
    # 'Mirage`雨': {
    #     'pos': 1
    # },
    'Corrupted': {
        'pos': 0
    },
    # 'Armel': {
    #     'pos': 2
    # },
    'RESPECT': {
        'pos': 2
    },
# # Team Resilience

# # Vici Gaming
    'shiro': {
        'pos': 0
    },
    'Xm': {
        'pos': 1
    },
    'Bach': {
        'pos': 0
    },
    'XinQ': {
        'pos': 2
    },
    'y`': {
        'pos': 2
    },
# # OG
    'Natsumi': {
        'pos': 0
    },
    'Yopaj-': {
        'pos': 1
    },
    'Raven': {
        'pos': 0
    },
    'TIMS': {
        'pos': 2
    },
    'skem': {
        'pos': 2
    },
# # LGD Gaming
    'Yuma': {
        'pos': 0
    },
    'TaiLung': {
        'pos': 1
    },
    'Wisper': {
        'pos': 0
    },
    'Thiolicor': {
        'pos': 2
    },
    'KingJungles': {
        'pos': 2
    },
# # GamerLegion
    'Ghost': {
        'pos': 0
    },
    'RCY': {
        'pos': 1
    },
    'Fayde': {
        'pos': 0
    },
    'Bignum': {
        'pos': 2
    },
    'Speeed': {
        'pos': 2
    },
}

with open("leagues.json", "r", encoding="utf-8") as f:
    leagues_data = json.load(f)

try:
    with open('players_stat.json', 'r', encoding='utf-8') as f:
        player_stat = json.load(f)
except FileNotFoundError:
    player_stat = {}

leagues_ids = list(map(int, leagues_data.keys()))

def addPlayerFields(league_id, player, match_r):
    if player['name'] not in player_stat:
        player_stat[player['name']] = {}

    if league_id not in player_stat[player['name']]:
        player_stat[player['name']][league_id] = {
            "stats": {},
        }

        if "general" not in player_stat[player['name']]:
            player_stat[player['name']]["general"] = {}

        player_stat[player['name']]["general"]["team_logo"] = (match_r['radiant_team']['logo_url'] if player['isRadiant'] else match_r['dire_team']['logo_url'])
        player_stat[player['name']]["general"]["pos"] = PLAYERS_LIST[player['name']]['pos']
    
        if PLAYERS_LIST[player['name']]['pos'] in (0, 1):
            player_stat[player['name']][league_id]['stats']['red'] = {
                "kills": [],
                "deaths": [],
                "creep_score": [],
                "gpm": [],
                "madstone_collected": [],
                "tower_kills": [],
            }
        if PLAYERS_LIST[player['name']]['pos'] in (1, 2):
            player_stat[player['name']][league_id]['stats']['blue'] = {
                "obs_placed": [],
                "camps_stacked": [],
                "runes_grabbed": [],
                "watchers_taken": [],
                "smokes_used": [],
                "lotuses_grabbed": []
            }
        if PLAYERS_LIST[player['name']]['pos'] in (0, 1, 2):
            player_stat[player['name']][league_id]['stats']['green'] = {
                "roshan_kills": [],
                "teamfight_participation": [],
                "stuns": [],
                "courier_kills": [],
                "tormentor_kills": [],
                "firstblood": [],
            }

for league_id in leagues_ids:
    matches = requests.get(f"https://api.opendota.com/api/leagues/{league_id}/matches").json()
    total_matches_count = 0
    time.sleep(1.2)

    for match in matches:
        match_id = match['match_id']
        match_r = requests.get(f"https://api.opendota.com/api/matches/{match_id}").json()

        time.sleep(1.2)
        
        max_retries = 3
        for attempt in range(max_retries):
            if "players" in match_r:
                break
            else:
                print(f"Не удалось получить данные {match} (попытка {attempt + 1})")
                if attempt < max_retries - 1:
                    time.sleep(5)
                    match_r = requests.get(f"https://api.opendota.com/api/matches/{match_id}").json()
        else:
            print(f"Не удалось получить данные о матче {match} после {max_retries} попыток")
            continue

        allPlayers = match_r['players']

        is_match_counted = False

        for player in match_r['players']:
            if player['name'] not in PLAYERS_LIST:
                continue

            if player['name'] not in player_stat:
                player_stat[player['name']] = {}
            if league_id not in player_stat[player['name']]:
                addPlayerFields(league_id, player, match_r)

            if player['name'] in PLAYERS_LIST:

                if not is_match_counted:
                    total_matches_count += 1
                    is_match_counted = True

                if player['name'] not in player_stat:
                    addPlayerFields(league_id, player, match_r)
                elif league_id not in player_stat[player['name']]:
                    addPlayerFields(league_id, player, match_r)
                else:
                    if PLAYERS_LIST[player['name']]['pos'] in (0, 1) and 'red' in player_stat[player['name']][league_id]['stats']:
                        player_stat[player['name']][league_id]['stats']['red']['kills'].append(player['kills'])
                        player_stat[player['name']][league_id]['stats']['red']['deaths'].append(player['deaths'])
                        player_stat[player['name']][league_id]['stats']['red']['creep_score'].append(player['last_hits'] + player['denies'])
                        player_stat[player['name']][league_id]['stats']['red']['gpm'].append(player['gold_per_min'])
                        # player_stat[player['name']][league_id]['stats']['red']['madstone_collected'].append(player.get('item_uses', {}).get('madstone_bundle', 0))
                        player_stat[player['name']][league_id]['stats']['red']['tower_kills'].append(player['towers_killed'])
                    if PLAYERS_LIST[player['name']]['pos'] in (1, 2) and 'blue' in player_stat[player['name']][league_id]['stats']:
                        player_stat[player['name']][league_id]['stats']['blue']['obs_placed'].append(player['obs_placed'])
                        player_stat[player['name']][league_id]['stats']['blue']['camps_stacked'].append(player['camps_stacked'])
                        player_stat[player['name']][league_id]['stats']['blue']['runes_grabbed'].append(player['rune_pickups'])
                        player_stat[player['name']][league_id]['stats']['blue']['watchers_taken'].append(player.get('ability_uses', {}).get('ability_lamp_use', 0))
                        player_stat[player['name']][league_id]['stats']['blue']['smokes_used'].append(player.get('item_uses', {}).get('smoke_of_deceit', 0))
                        # player_stat[player['name']][league_id]['stats']['blue']['lotuses_grabbed'].append(player.get('item_uses', {}).get('famango', 0))
                    if PLAYERS_LIST[player['name']]['pos'] in (0, 1, 2) and 'green' in player_stat[player['name']][league_id]['stats']:
                        player_stat[player['name']][league_id]['stats']['green']['roshan_kills'].append(player['roshans_killed'])
                        player_stat[player['name']][league_id]['stats']['green']['teamfight_participation'].append(player['teamfight_participation'])
                        player_stat[player['name']][league_id]['stats']['green']['stuns'].append(player['stuns'])
                        player_stat[player['name']][league_id]['stats']['green']['courier_kills'].append(player['courier_kills'])
                        player_stat[player['name']][league_id]['stats']['green']['firstblood'].append(player['firstblood_claimed'])
                        player_stat[player['name']][league_id]['stats']['green']['tormentor_kills'].append(player.get('killed', {}).get('npc_dota_miniboss', 0))

    leagues_data[str(league_id)]['total_matches_parsed'] = total_matches_count

with open('players_stat.json', "w", encoding="utf-8") as f:
    json.dump(player_stat, f, ensure_ascii=False, indent=4)

with open('leagues.json', "w", encoding="utf-8") as f:
    json.dump(leagues_data, f, ensure_ascii=False, indent=4)