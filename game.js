class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

class Bullet extends GameObject {
    constructor(x, y, dy) {
        super(x, y, 4, 10, "white");
        this.dy = dy;
    }

    update() {
        this.y += this.dy;
    }
}

class SpaceShip extends GameObject {
    constructor(x, y, width, height, color, canvasHeight) {
        super(x, y, width, height, color);
        this.canvasHeight = canvasHeight;
        this.bullets = [];
    }

    shoot(dy) {
        this.bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y, dy));
    }

    draw(ctx) {
        super.draw(ctx);
        this.bullets = this.bullets.filter(bullet => bullet.y > 0 && bullet.y < this.canvasHeight);
        this.bullets.forEach(bullet => {
            bullet.update();
            bullet.draw(ctx);
        });
    }
}

class Player extends SpaceShip {
    constructor(x, y, width, height, color, canvasWidth, canvasHeight) {
        super(x, y, width, height, color, canvasHeight);
        this.canvasWidth = canvasWidth;
        this.speed = 5;
        this.image = new Image();
        this.image.src = 'Ship.png'; 
        this.lives = 3; // Add lives property
        this.shootSound = new Audio('shoot.wav'); // Add shoot sound
        this.canShoot = true; // Add canShoot property
        this.shootCooldown = 400; // Cooldown period in milliseconds
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.bullets = this.bullets.filter(bullet => bullet.y > 0 && bullet.y < this.canvasHeight);
        this.bullets.forEach(bullet => {
            bullet.update();
            bullet.draw(ctx);
        });
    }

    update(dx) {
        this.x += dx;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.canvasWidth) this.x = this.canvasWidth - this.width;
    }

    shoot(dy) {
        if (this.canShoot) {
            super.shoot(dy);
            this.shootSound.play(); // Play shoot sound
            this.canShoot = false;
            setTimeout(() => this.canShoot = true, this.shootCooldown); // Reset canShoot after cooldown
        }
    }
}

class Invader extends SpaceShip {
    constructor(x, y, width, height, color, canvasHeight) {
        super(x, y, width, height, color, canvasHeight);
        this.image = new Image();
        this.image.src = 'invaders.png'; // Path to the invader image
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.bullets = this.bullets.filter(bullet => bullet.y > 0 && bullet.y < this.canvasHeight);
        this.bullets.forEach(bullet => {
            bullet.update();
            bullet.draw(ctx);
        });
    }
}

class Asteroid {
    constructor(x, y, parts) {
        this.parts = parts.map(part => new GameObject(x + part.x, y + part.y, part.width, part.height, part.color));
    }

    draw(ctx) {
        this.parts.forEach(part => part.draw(ctx));
    }

    collidesWith(obj) {
        return this.parts.some(part => part.collidesWith(obj));
    }

    removeOnCollide(obj) {
        this.parts = this.parts.filter(part => !part.collidesWith(obj));
    }
}

class Game {
    constructor(canvas, ctx, scoreDisplay) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scoreDisplay = scoreDisplay;
        this.player = new Player(canvas.width / 2 - 20, canvas.height - 30, 40, 20, "green", canvas.width, canvas.height);
        this.invaders = [];
        this.asteroids = [];
        this.score = 0;
        this.invaderSpeed = 0.2;
        this.invaderDirection = 1;
        this.gameOver = false;
        this.enemyFireRate = 100;
        this.enemyFireTimer = 0;
        this.asteroidsParts = 4;
        this.noOfAsteroids = 2; 
        this.asteroidsSpace = 200; 
        this.createInvaders();
        this.createAsteroids();
        this.restartButton = document.getElementById("restartButton");
        this.restartButton.style.display = "none";
        this.restartButton.addEventListener("click", () => this.restart());
    }

    createInvaders() {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 10; col++) {
                this.invaders.push(new Invader(col * 40 + 20, row * 30 + 20, 30, 20, "red", this.canvas.height));
            }
        }
    }

    createAsteroids() {
        const parts = [
            { x: 0, y: 0, width: 20, height: 20, color: "gray" },
            { x: 20, y: 0, width: 20, height: 20, color: "gray" },
            { x: 0, y: 20, width: 20, height: 20, color: "gray" },
            { x: 20, y: 20, width: 20, height: 20, color: "gray" }
        ];
        for (let i = 0; i < this.noOfAsteroids; i++) {
            this.asteroids.push(new Asteroid(i * this.asteroidsSpace + 100, 100, parts));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.ctx);
        this.invaders.forEach(invader => invader.draw(this.ctx));
        this.asteroids.forEach(asteroid => asteroid.draw(this.ctx));
    }

    update() {
        if (this.gameOver) {
            this.ctx.font = "30px 'Press Start 2P', cursive"; // Retro font
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Game Over", this.canvas.width / 2, this.canvas.height / 2);
            this.restartButton.style.display = "block";
            return;
        }

        this.draw();
        this.moveInvaders();
        this.checkCollisions();
        this.enemyFire();
        this.scoreDisplay.textContent = "Score: " + this.score + " Lives: " + this.player.lives; // Display lives
        requestAnimationFrame(() => this.update());
    }

    moveInvaders() {
        this.invaders.forEach(invader => invader.update(this.invaderSpeed * this.invaderDirection, 0));
        const leftMostInvader = Math.min(...this.invaders.map(invader => invader.x));
        const rightMostInvader = Math.max(...this.invaders.map(invader => invader.x + invader.width));

        if (leftMostInvader < 0 || rightMostInvader > this.canvas.width) {
            this.invaderDirection *= -1;
            this.invaders.forEach(invader => invader.update(0, 20));
        }
    }

    checkCollisions() {
        this.player.bullets.forEach((bullet, bulletIndex) => {
            this.invaders.forEach((invader, invaderIndex) => {
                if (bullet.collidesWith(invader)) {
                    this.player.bullets.splice(bulletIndex, 1);
                    this.invaders.splice(invaderIndex, 1);
                    this.score += 10;
                }
            });

            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (asteroid.collidesWith(bullet)) {
                    asteroid.removeOnCollide(bullet);
                    this.player.bullets.splice(bulletIndex, 1);
                    if (asteroid.parts.length === 0) {
                        this.asteroids.splice(asteroidIndex, 1);
                        this.createAsteroids(); 
                        
                    }
                }
            });
        });

        this.invaders.forEach(invader => {
            invader.bullets.forEach((bullet, bulletIndex) => {
                if (bullet.collidesWith(this.player)) {
                    invader.bullets.splice(bulletIndex, 1);
                    this.player.lives -= 1; // Decrease lives
                    if (this.player.lives <= 0) {
                        this.gameOver = true;
                    }
                }
            });

            if (invader.y + invader.height >= this.player.y) {
                this.player.lives -= 1; // Decrease lives
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                }
            }
        });

        if (this.invaders.length === 0 && !this.gameOver) {
            this.createInvaders();
        }
    }

    enemyFire() {
        this.enemyFireTimer++;
        if (this.enemyFireTimer > this.enemyFireRate) {
            const randomInvader = this.invaders[Math.floor(Math.random() * this.invaders.length)];
            if (randomInvader) {
                randomInvader.shoot(5);
            }
            this.enemyFireTimer = 0;
        }
    }

    handleKeydown(event) {
        if (event.key === "ArrowLeft") {
            this.player.update(-this.player.speed);
        } else if (event.key === "ArrowRight") {
            this.player.update(this.player.speed);
        } else if (event.key === " ") {
            this.player.shoot(-5);
        }
    }

    start() {
        document.addEventListener("keydown", (event) => this.handleKeydown(event));
        this.update();
    }

    restart() {
        this.player = new Player(this.canvas.width / 2 - 20, this.canvas.height - 30, 40, 20, "green", this.canvas.width, this.canvas.height);
        this.invaders = [];
        this.asteroids = [];
        this.score = 0;
        this.invaderSpeed = 0.2; // Reset speed
        this.invaderDirection = 1;
        this.gameOver = false;
        this.enemyFireTimer = 0;
        this.createInvaders();
        this.createAsteroids();
        this.restartButton.style.display = "none";
        this.update();
    }
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const game = new Game(canvas, ctx, scoreDisplay);
game.start();
