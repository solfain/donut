# 🍩 DONUTBET — DonutSMP-Style Gambling Site

A fan-made, demo gambling site inspired by DonutSMP. Bet virtual **Shards (◆)** across 6 fully playable games — no real money, no real Minecraft items.

> ⚠️ **Demo only.** Not affiliated with DonutSMP / DrDonut. All shards are virtual and have no real-world value.

## 🎮 Games

| Game | How it works |
|---|---|
| 🚀 **Crash** | Animated multiplier graph — cash out before it crashes (up to 50×, optional auto-cashout) |
| 🪙 **Coinflip** | Donut vs Chocolate, 3D coin flip, 1.92× payout |
| 💣 **Mines** | 5×5 grid, 3–24 TNT, combinatorial multipliers, cash out anytime |
| 🎡 **Roulette** | Spinning reel — Pink/Chocolate pay 2×, Gold pays 14× |
| 🏆 **Jackpot** | Timed pot with bot players, spinning winner wheel, winner takes all |
| 📦 **Cases** | Starter / Donut / GOD crates with Minecraft loot (Elytra, Dragon Egg, Golden Donut…) that auto-sells for shards |

## ✨ Features

- **Persistent balance** (localStorage) — starts at ◆ 10,000
- **Free bonus** — claim ◆ 1,000 from the sidebar (60s demo cooldown)
- **Demo deposit / withdraw** modals with Minecraft username linking
- **Live bets feed**, simulated chat, leaderboard, big-win ticker & online counters
- **Provably-fair style** hash badges per game, bet helpers (½ / 2× / MAX)
- Fully responsive (sidebar + chat collapse on mobile)

## 🚀 Run it

No build step needed:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser.

## 📁 Structure

```
index.html          # SPA shell — lobby + all 6 game views
assets/style.css    # Donut-pink / gold casino theme
assets/app.js       # Casino engine: balance, games, bots, chat
images/donut-hero.png  # AI-generated hero art
```
