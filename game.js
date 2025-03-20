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
        this.lives = 3; 
        this.shootSound = new Audio('shoot.wav'); 
        this.canShoot = true; 
        this.shootCooldown = 400; 
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
        this.hits = 0; // Add hits property
    }

    draw(ctx) {
        this.parts.forEach(part => {
            part.color = this.getColor(); // Update color based on hits
            part.draw(ctx);
        });
    }

    collidesWith(obj) {
        return this.parts.some(part => part.collidesWith(obj));
    }

    removeOnCollide(obj) {
        this.hits++;
        if (this.hits >= 9) { // Require 9 hits to destroy
            this.parts = this.parts.filter(part => !part.collidesWith(obj));
        }
    }

    getColor() {
        if (this.hits < 3) return "gray";
        if (this.hits < 6) return "darkgray";
        return "black";
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
        this.level = 1; // Add level property
        this.invaderSpeed = 0.2;
        this.invaderDirection = 1;
        this.gameOver = false;
        this.enemyFireRate = 100;
        this.enemyFireTimer = 0;
        this.asteroidsParts = 4;
        this.noOfAsteroids = 10; // Adjusted number of asteroids
        this.asteroidsSpace = 70; // Adjusted space between asteroids
        this.createInvaders();
        this.createAsteroids();
        this.restartButton = document.getElementById("restartButton");
        this.restartButton.style.display = "none";
        this.restartButton.addEventListener("click", () => this.restart());
        this.gameOverScreen = document.getElementById("gameOverScreen");
        this.playerNameInput = document.getElementById("playerName");
        this.saveScoreButton = document.getElementById("saveScoreButton");
        this.saveScoreButton.addEventListener("click", () => this.saveScore());
        this.scoreList = document.getElementById("scoreList");
        this.loadScores();
        this.backgroundMusic = document.getElementById("backgroundMusic"); // Add background music
        this.invaderKilledSound = new Audio('invaderkilled.wav'); // Add invader killed sound
        this.explosionSound = new Audio('explosion.wav'); // Add explosion sound
        this.muteMusicButton = document.getElementById("muteMusicButton"); // Add mute music button
        this.muteSoundEffectsButton = document.getElementById("muteSoundEffectsButton"); // Add mute sound effects button
        this.muteMusicButton.addEventListener("click", () => this.toggleMuteMusic());
        this.muteSoundEffectsButton.addEventListener("click", () => this.toggleMuteSoundEffects());
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
        const yPosition = this.canvas.height - 100; // Adjusted position for larger playfield
        for (let i = 0; i < this.noOfAsteroids; i++) {
            this.asteroids.push(new Asteroid(i * this.asteroidsSpace + 50, yPosition, parts));
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
            this.explosionSound.play(); // Play explosion sound
            this.ctx.font = "30px 'Press Start 2P', cursive"; // Retro font
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Game Over", this.canvas.width / 2, this.canvas.height / 2);
            this.restartButton.style.display = "block";
            this.gameOverScreen.style.display = "block";
            return;
        }

        this.draw();
        this.moveInvaders();
        this.checkCollisions();
        this.enemyFire();
        this.scoreDisplay.textContent = "Score: " + this.score + " Lives: " + this.player.lives + " Level: " + this.level; // Display lives and level
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
                    this.invaderKilledSound.play(); // Play invader killed sound
                }
            });

            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (asteroid.collidesWith(bullet)) {
                    asteroid.removeOnCollide(bullet);
                    this.player.bullets.splice(bulletIndex, 1);
                    if (asteroid.parts.length === 0) {
                        this.asteroids.splice(asteroidIndex, 1);
                    }
                }
            });
        });

        this.invaders.forEach(invader => {
            invader.bullets.forEach((bullet, bulletIndex) => {
                if (bullet.collidesWith(this.player)) {
                    invader.bullets.splice(bulletIndex, 1);
                    this.player.lives -= 1; 
                    if (this.player.lives <= 0) {
                        this.gameOver = true;
                    }
                }

                this.asteroids.forEach((asteroid, asteroidIndex) => {
                    if (asteroid.collidesWith(bullet)) {
                        asteroid.removeOnCollide(bullet);
                        invader.bullets.splice(bulletIndex, 1);
                        if (asteroid.parts.length === 0) {
                            this.asteroids.splice(asteroidIndex, 1);
                        }
                    }
                });
            });

            if (invader.y + invader.height >= this.player.y) {
                this.player.lives -= 1; 
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                }
            }
        });

        if (this.invaders.length === 0 && !this.gameOver) {
            this.levelUp();
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
        document.addEventListener("keydown", (event) => {
            if (!this.backgroundMusic.playing) {
                this.backgroundMusic.play(); // Play background music
            }
            this.handleKeydown(event);
        });
        this.update();
    }

    restart() {
        this.player = new Player(this.canvas.width / 2 - 20, this.canvas.height - 30, 40, 20, "green", this.canvas.width, this.canvas.height);
        this.invaders = [];
        this.asteroids = [];
        this.score = 0;
        this.level = 1; // Reset level
        this.invaderSpeed = 0.2; 
        this.invaderDirection = 1;
        this.gameOver = false;
        this.enemyFireTimer = 0;
        this.createInvaders();
        this.createAsteroids();
        this.restartButton.style.display = "none";
        this.gameOverScreen.style.display = "none";
        this.update();
    }

    levelUp() {
        this.level++;
        this.invaderSpeed *= 1.2; // Increase invader speed by 20%
        this.enemyFireRate *= 0.9; // Increase enemy fire rate by 10%
        this.displayLevelUp(); // Display level up message
        this.createInvaders();
    }

    displayLevelUp() {
        this.ctx.font = "30px 'Press Start 2P', cursive"; // Retro font
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Level " + this.level, this.canvas.width / 2, this.canvas.height / 2);
        setTimeout(() => {
            this.ctx.clearRect(this.canvas.width / 2 - 100, this.canvas.height / 2 - 20, 200, 40);
        }, 2000); // Display for 2 seconds
    }

    saveScore() {
        const playerName = this.playerNameInput.value;
        if (playerName) {
            const scores = JSON.parse(localStorage.getItem('scores')) || [];
            scores.push({ name: playerName, score: this.score });
            scores.sort((a, b) => b.score - a.score);
            localStorage.setItem('scores', JSON.stringify(scores));
            this.loadScores();
            this.playerNameInput.value = '';
            this.gameOverScreen.style.display = "none";
        }
    }

    loadScores() {
        const scores = JSON.parse(localStorage.getItem('scores')) || [];
        this.scoreList.innerHTML = '';
        scores.forEach(score => {
            const li = document.createElement('li');
            li.textContent = `${score.name}: ${score.score}`;
            this.scoreList.appendChild(li);
        });
    }

    toggleMuteMusic() {
        this.backgroundMusic.muted = !this.backgroundMusic.muted;
        this.muteMusicButton.textContent = this.backgroundMusic.muted ? "Unmute Music" : "Mute Music";
    }

    toggleMuteSoundEffects() {
        const soundEffects = [this.player.shootSound, this.invaderKilledSound, this.explosionSound];
        soundEffects.forEach(sound => sound.muted = !sound.muted);
        this.muteSoundEffectsButton.textContent = soundEffects[0].muted ? "Unmute Sound Effects" : "Mute Sound Effects";
    }
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const game = new Game(canvas, ctx, scoreDisplay);
game.start();
