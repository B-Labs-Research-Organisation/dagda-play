# 🏰 Dagda Play - Web & Farcaster Mini App

A blockchain-powered gaming mini app for Farcaster. Play Coinflip & Randomizer games, earn PIE tokens, and compete with friends on the decentralized social network!

![Dagda Play](https://img.shields.io/badge/Farcaster-Mini%20App-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **🎮 Two Classic Games**: Coinflip (50/50 odds) & Randomizer (multi-outcome casino style)
- **🔗 Dual Authentication**: Farcaster OAuth + WalletConnect integration
- **🎯 Farcaster Incentives**: +5 bonus PIE tokens and 5 daily plays for Farcaster users
- **📱 Mobile-First**: Optimized for Farcaster mobile app experience
- **💰 PIE Token Economy**: Earn virtual tokens with real economic incentives
- **🏆 Competitive Play**: Daily limits and persistent leaderboards
- **🎨 Beautiful UI**: Immersive Celtic-inspired design with smooth animations

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **WalletConnect Project ID** (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/dagda-play.git
cd dagda-play
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local and add your WalletConnect Project ID
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** 🎮

## 🎯 How to Play

### Coinflip Game
- **Bet**: 5 PIE tokens
- **Win**: 10 PIE (if correct) or lose 5 PIE
- **Odds**: 50/50 fair chance
- **Strategy**: Pure luck with Celtic-themed coin flip animation

### Randomizer Game
- **Bet**: 5 PIE tokens
- **Outcomes**: 5 possible results from -10 PIE to +10 PIE jackpot
- **House Edge**: Balanced for engaging gameplay
- **Features**: Animated slot machine with Irish mythology themes

### Daily Limits & Incentives
- **Regular Users**: 3 plays per game per day
- **Farcaster Users**: 5 plays per game per day (+5 bonus PIE on signup)
- **Reset Time**: Daily at UTC midnight

## 🔗 Farcaster Integration

### As a Website
Dagda Play works as a standalone web application with full wallet integration.

### As a Farcaster Mini App
1. **Deploy** your app to a public URL (Vercel, Railway, etc.)
2. **Post on Farcaster** with your app URL
3. **Mini app launches** directly in Farcaster mobile app
4. **Auto-authentication** with Farcaster account
5. **Bonus rewards** for Farcaster users

### Frame Support
- **Main Menu**: `/api/frame` - Game selection frame
- **Coinflip**: `/api/frame/coinflip` - Interactive coinflip frame
- **Randomizer**: `/api/frame/randomizer` - Randomizer game frame
- **Leaderboard**: `/api/frame/leaderboard` - Community rankings

## 🛠️ Environment Setup

Create `.env.local` with:

```env
# Required: WalletConnect for blockchain wallet connections
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Optional: Custom RPC endpoints
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# For production deployment (when you deploy):
NEXT_PUBLIC_APP_URL=https://your-deployed-app.com
NEXT_PUBLIC_FARCASTER_APP_URL=https://your-deployed-app.com
```

## 🚢 Deployment

### Vercel (Recommended - 5 minutes)
```bash
npm install -g vercel
vercel --prod
# Follow prompts - auto-detects Next.js
```

### Railway
```bash
npm install -g @railway/cli
railway init
railway up
```

### Manual Server
```bash
npm run build
npm start
# Configure reverse proxy for production
```

## 🏗️ Project Structure

```
dagda-play/
├── 📁 public/              # Static assets
├── 📁 src/
│   ├── 📁 app/            # Next.js 15 app router
│   │   ├── 📁 api/frame/ # Farcaster frame endpoints
│   │   └── 📁 globals.css
│   ├── 📁 components/
│   │   ├── 📁 auth/      # Farcaster & wallet auth
│   │   ├── 📁 games/     # Coinflip & Randomizer components
│   │   └── 📁 providers/ # React context providers
│   └── 📁 lib/           # Game logic & utilities
├── 📄 package.json
├── 📄 next.config.ts
├── 📄 tailwind.config.ts
└── 📄 README.md
```

## 🎨 Customization

### Theme & Styling
- **Colors**: Emerald green Celtic theme in `globals.css`
- **Animations**: Custom coin flip animations
- **Fonts**: Modern system fonts with Celtic touches

### Game Logic
- **Modify odds** in `/components/games/`
- **Adjust token rewards** in game components
- **Add new games** following existing patterns

### Farcaster Integration
- **Frame images**: Edit HTML in `/api/frame/*/image/route.ts`
- **Frame actions**: Customize button behaviors
- **Incentives**: Adjust bonus amounts in `/app/page.tsx`

## 🔧 Development

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting

# Testing games
npm run dev
# Visit localhost:3000 to test all features
```

## 🧪 Testing

### Local Testing
```bash
npm run dev
# Test website at localhost:3000
# Test frames at localhost:3000/api/frame
```

### Farcaster Testing
1. Deploy to public URL
2. Post app URL on Farcaster
3. Test mini app in Farcaster mobile app
4. Verify frame interactions work

## 📊 Game Analytics

- **Player balances** stored in localStorage
- **Daily limits** enforced per wallet address
- **Game history** tracked for fairness
- **Farcaster incentives** automatically applied

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-game`
3. Commit changes: `git commit -am 'Add new game'`
4. Push to branch: `git push origin feature/new-game`
5. Submit pull request

## 📈 Roadmap

- ✅ **Core Games**: Coinflip & Randomizer
- ✅ **Farcaster Integration**: Mini app & frames
- ✅ **Wallet Integration**: Multi-wallet support
- 🚧 **Token Integration**: Real PIE tokens on Base
- 🚧 **NFT Rewards**: Achievement-based NFTs
- 🚧 **Tournaments**: Competitive daily challenges

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Wagmi + Viem + Base Sepolia
- **Farcaster**: Custom mini app integration
- **Deployment**: Vercel/Railway/one-click deploy

## 📝 License

**MIT License** - Free to use, modify, and distribute. Perfect for building your own Farcaster mini apps!

## 🙏 Acknowledgments

- **Farcaster** for the decentralized social platform
- **Base** for fast, low-cost blockchain infrastructure
- **Irish Mythology** for Dagda the gaming god inspiration
- **Open source community** for amazing tools

---

**🎮 Built with ❤️ for the Farcaster gaming community**

**Ready to earn PIE tokens? Deploy and share your mini app today! 🚀**
