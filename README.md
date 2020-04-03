# ProductionWeaver

An application designed for independent film production management.

## Description

Most film productions are not cheap! As the independent film movement continues to grow all over the globe, indie filmmakers are required to make vital decisions on where to skimp and where to allocate their funds, often times working with shoestring budgets.

A common frustration is the cost of quality production management software. ProductionWeaver is here to provide indie filmmakers a truly cost effective way to manage productions from script breakdown, shot listing, budgeting, etc.

ProductionWeaver is currently in the early stages of development with the script breakdown feature being the first to be released.

## Demo
-  [See the live demo](https://productionweaver-app.now.sh/home)

## API documentation
Authentication: All endpoints require the use of JWT tokens which are assigned at login.

### GET /api/productions/
Gets the productions owned by the user in the JWT token.

### POST /api/productions/
Posts a new production with user in the JWT token listed as the production owner.

Request body must include:
- "first_name": string
- "last_name": string
- "email": string with correctly formatted email address (@domain.com)
- "password": string

### GET /api/productions/{productionId}
Gets all details for a production based on the production id provided. 

### GET /api/scenes/production/{productionId}
Gets all scenes for a production based on the production id provided.

### POST /api/scenes/{productionId}
Posts a new scene for a production based on the production id provided.

Request body must include:
- "scene_script_number": integer
- "setting": 'Int.' or 'Ext.' strings
- "location": string
- "time_of_day": string
- "short_summary": string

### GET /api/scenes/scene/{sceneId}
Gets all details for a scene based on the scene id provided.

### GET /api/elements/scene/{sceneId}
Gets all elements for a scene based on the scene id provided.

### POST /api/elements/scene/{sceneId}
Posts a new element for a scene based on the scene id provided.

Request body must include:
- "category": string
- "description": string

## Scripts
- Start application for development: `npm run dev`
- Run tests `npm test`

## Screenshots

Home
![home](https://github.com/maximus202/productionweaver-app/blob/master/public/Home.png?raw=true)

Dashboard
![dashboard](https://github.com/maximus202/productionweaver-app/blob/master/public/Dashboard.png?raw=true)

Production Tools
![productiontools](https://github.com/maximus202/productionweaver-app/blob/master/public/ProductionTools.png?raw=true)

Scene List
![scenelist](https://github.com/maximus202/productionweaver-app/blob/master/public/SceneList.png?raw=true)

New Scene Form
![newscene](https://github.com/maximus202/productionweaver-app/blob/master/public/NewScene.png)

Scene Breakdown
![scenebreakdown](https://github.com/maximus202/productionweaver-app/blob/master/public/SceneBreakdown.png?raw=true)

## Built With
- Node
- Express
- PostgreSQL

## Last updated
April 3, 2020.