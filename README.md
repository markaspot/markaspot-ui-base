# Mark-a-Spot UI - Nuxt App

A Nuxt.js frontend application designed to use Mark-a-Spot as a backend for civic issue reporting.

This repository serves as a starter application and example of how to build citizen reporting platforms using the Mark-a-Spot.

## Release: v1.1.1

## Features

- Mobile-first responsive design
- Issue reporting and tracking
- Map-based visualization
- Integration with Mark-a-Spot backend
          
## Setup

The easiest way to run this application is with the main [markaspot/mark-a-spot](https://github.com/markaspot/mark-a-spot) repository.
This contains a docker-compose file that runs the already built app as docker image.

### Docker standalone

```bash
docker pull markaspot/markaspot-ui-base:v1.1.1
docker run -p 3000:3000 markaspot/markaspot-ui-base:v1.1.1
```

### Manual Setup

If you want to build and run the application manually:

#### Prerequisites

- Node.js 20+
- NPM or Yarn

#### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Development server: `npm run dev`
4. Build for production: `npm run build`
5. Start production server: `npm run start`

## LICENSE
This project is licensed under the             
MIT License - See [LICENSE](LICENSE) file
