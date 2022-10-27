/** @type {HTMLCanvasElement} */
const FPS = 30; //frames per second
const FRICTION = 0.7; //friction coeffecent of space
const GAME_LIVES = 3; //starting number of lives
const LASER_MAX = 10; //maximum number of lasers on screen at once
const LASER_DIST = 0.6; //maximum distance laser can travel as fraction of screen width
const LASER_SPD = 500; //speed of lasers in pixels per second
const LASER_EXPLODE_DUR = 0.1; //duration of lasers' explosion
const ROIDS_JAG = 0.4; //jaggeredness of asteriod
const ROIDS_NUM = 3; //starting number of asteroids
const ROIDS_SIZE = 100; //starting size of asteroids in pixels
const ROIDS_SPEED = 50; //starting speed of asteroids
const ROIDS_VERT = 10; //average number of vertices on each asteroid 
const SHIP_SIZE = 30; //ship size in pixels per second
const TURN_SPEED = 360; //turn speed in degrees per second
const SHIP_THRUST = 5; //acceleration of the ship
const SHIP_EXPLODE_DUR = 0.3; //duration of ship's explosion
const SHIP_BLINK_DUR = 0.1; //duration of ship's blink during invisibility in seconds
const SHIP_INV_DUR = 3; //duration of ship's invisibility in seconds
const SHOW_BOUNDING = false; //show or hide collision boundaries
const TEXT_FADE_TIME = 2.5; //text fade time in seconds
const TEXT_SIZE = 40; //text font size in pixels

var canvas = document.getElementById("game-screen");
var ctx = canvas.getContext("2d");

//set up game parameters
var level, lives, roids, ship, text, textAlpha;
newGame();

//event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt(){
    roids = [];
    let x, y;
    for (let i = 0; i < ROIDS_NUM + level; i++){
        do {
            x = Math.floor(Math.random() * canvas.width); 
            y = Math.floor(Math.random() * canvas.height);
        } while(distanceBetweenPoints(ship.x, ship.y, x, y) < 2 * ROIDS_SIZE + ship.r);
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    }
}

function destroyAsteroid(index){
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    //slpit asteroid in two if necessary
    if(r == Math.ceil(ROIDS_SIZE / 2)){
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4 )));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4 )));
    } else if(r == Math.ceil(ROIDS_SIZE / 4 )){
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8 )));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8 )));
    }

    // destroy the asteroid
    roids.splice(index, 1);

    //new level when no more asteroids
    if(roids.length === 0){
        level++;
        newLevel();
    }
}

function distanceBetweenPoints(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = "white"){
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();

    ctx.moveTo( //nose of the ship
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );

    ctx.lineTo( //ship rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );

    ctx.lineTo( //ship rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );

    ctx.closePath();
    ctx.stroke();
}

function explodeShip(){
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}

function gameOver(){
     ship.dead = true;
     text = "Game Over";
     textAlpha = 1.0;
}

function keyDown(event){
    if(ship.dead) return;
    switch(event.keyCode){
        case 32:
            shootLaser();
            break;
        case 37:
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;

        case 38:
            ship.thrusting = true;
            break;

        case 39:
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
    }
}

function keyUp(event){
    if(ship.dead) return; 
    switch(event.keyCode){
        case 32:
            ship.canShoot = true;
            break;
        case 37:
            ship.rot = 0;
            break;

        case 38:
            ship.thrusting = false;
            break;

        case 39:
            ship.rot = 0;
            break;
    }
}

function newAsteroid(x,y,r){
    var lvlMult = 1 + 0.1 * level;
    roid = {
        x: x,
        y: y,
        x_vel: Math.random() * ROIDS_SPEED * lvlMult / FPS * (Math.random() > 0.5 ? 1 : -1),
        y_vel: Math.random() * ROIDS_SPEED * lvlMult / FPS * (Math.random() > 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2,
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: []
    };

    // create the vertex offset array
    for(let i = 0; i < roid.vert; i++){
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}

function newGame(){
    level = 0;
    lives = GAME_LIVES;
    ship = newShip();
    newLevel();
}

function newLevel(){
    text = `Level ${level + 1}`;
    textAlpha = 1.0;
    createAsteroidBelt();
}

function newShip() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI,
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        canShoot: true,
        dead: false,
        explodeTime: 0,
        lasers: [],
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0
        }
    }
}

function shootLaser(){
    //create laser object
    if(ship.canShoot && ship.lasers.length < LASER_MAX){
        ship.lasers.push({ //from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS,
            yv: -LASER_SPD * Math.sin(ship.a) / FPS,
            dist: 0,
            explodeTime: 0
        });
    }

    //prevent further shooting
    ship.canShoot = false;
}

function update() {
    var blinkOn = ship.blinkNum % 2 == 0; 
    var exploding = ship.explodeTime > 0;

    // draw game world or space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //thrust the ship
    if(ship.thrusting && !ship.dead){
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

        //draw thrust
        if(!exploding && blinkOn){
            ctx.fillStyle = "red"
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();

            ctx.moveTo(
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            );
        
            ctx.lineTo(
                ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
            );
        
            ctx.lineTo(
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            );
        
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw or create the ship
    if(!exploding){
        if(blinkOn && !ship.dead){
            drawShip(ship.x, ship.y, ship.a);
        }

        //handle blink
        if (ship.blinkNum > 0){

            //reduce blink time
            ship.blinkTime--;

            //reduce blink num
            if(ship.blinkTime == 0){
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }

    } else {
        //draw explosion
        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
    }

    if(SHOW_BOUNDING){
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        ctx.stroke();
    }

    // draw lasers
    for(let i = 0; i < ship.lasers.length; i++){
        if (ship.lasers[i].explodeTime == 0){
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
            ctx.fill();
        } else {
            // draw the explosion
            ctx.fillStyle = "orangered";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.fillStyle = "pink";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
            ctx.fill();
        }
    }

    //detect laser hit on asteroid
    var ax, ay, ar, lx, ly;
    for(let i = roids.length - 1; i >= 0; i--){
        //get asteroid properties
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        //loop over the lasers
        for(let j = ship.lasers.length - 1; j >= 0; j--){
            //get laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            //detect hits
            if(ship.lasers[j].explodeTime == 0 && distanceBetweenPoints(ax, ay, lx, ly) < ar){

                //remove the asteroid activate laser explosion
                destroyAsteroid(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
                break;
            }
        }
    }

    //draw asteroids
    var x, y, r, a, vert, offs;
    for(let i = 0; i < roids.length; i++){
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = SHIP_SIZE / 20;
        // get asteroid properties
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;
        // draw a path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        );

        // draw the polygon
        for(let j = 1; j < vert; j++){
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();

        if(SHOW_BOUNDING){
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    }

    //draw level text
    if(textAlpha >= 0){
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canvas.width / 2, canvas.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    } else if (ship.dead){
        newGame();
    }

    //draw lives
    var lifeColour;
    for(let i = 0; i < lives; i++){
        lifeColour = exploding && i == lives - 1 ? "red" : "white";
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    if(!exploding){
        //check for collision
        if(ship.blinkNum == 0 && !ship.dead){
            for(let i = 0; i < roids.length; i++){
                if(distanceBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r){
                    explodeShip();
                    destroyAsteroid(i);
                    break;
                }
            }
        }

        //rotate ship
        ship.a += ship.rot;

        //move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } else {
        ship.explodeTime--;
        if(ship.explodeTime === 0){
            lives--;
            if(lives === 0){
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }

    //handle edges of the screen
    if(ship.x < 0 - ship.r){
        ship.x = canvas.width + ship.r;
    } else if(ship.x > canvas.width + ship.r){
        ship.x = 0 - ship.r;
    }

    if(ship.y < 0 - ship.r){
        ship.y = canvas.height + ship.r;
    } else if(ship.y > canvas.height + ship.r){
        ship.y = 0 - ship.r;
    }



    //move the lasers
    for(let i = ship.lasers.length - 1; i >= 0; i--){
        //check distance travelled
        if(ship.lasers[i].dist > LASER_DIST * canvas.width){
            ship.lasers.splice(i, 1);
            continue;
        }

        //handle the explosion
        if(ship.lasers[i].explodeTime > 0){
            ship.lasers[i].explodeTime--;

            //destroy laser after explode duration
            if(ship.lasers[i].explodeTime == 0){
                ship.lasers.splice(i, 1);
                continue;
            }
        } else {
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;
            //calculate the distance travelled
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
        }

        //handle edge of screen
        if(ship.lasers[i].x < 0){
            ship.lasers[i].x = canvas.width;
        } else if (ship.lasers[i].x > canvas.width){
            ship.lasers[i].x = 0;
        }
        if(ship.lasers[i].y < 0){
            ship.lasers[i].y = canvas.height;
        } else if(ship.lasers[i].y > canvas.height){
            ship.lasers[i].y = 0;
        }
    }

    for(let i = 0; i < roids.length; i++){
        // move the asteroid
        roids[i].x += roids[i].x_vel;
        roids[i].y += roids[i].y_vel;

        //handle edge of screen
        if(roids[i].x < 0 - roids[i].r){
            roids[i].x = canvas.width + roids[i].r;
        } else if(roids[i].x > canvas.width + roids[i].r){
            roids[i].x = 0 - roids[i].r
        }

        if(roids[i].y < 0 - roids[i].r){
            roids[i].y = canvas.height + roids[i].r;
        } else if(roids[i].y > canvas.height + roids[i].r){
            roids[i].y = 0 - roids[i].r
        }
    }
    //center dot
    // ctx.fillStyle = "red";
    // ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}
