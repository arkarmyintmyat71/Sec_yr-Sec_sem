Player player;
ArrayList<Platform> platforms;
ArrayList<Coin> coins;
ArrayList<Enemy> enemies;

boolean gameStart = false;
boolean gameWin = false;
boolean gameOver = false;

int score = 0;
int totalCoins = 8;

boolean leftPressed = false;
boolean rightPressed = false;
boolean upPressed = false;

void setup() {
  size(1000, 600);

  player = new Player(100, 450);

  platforms = new ArrayList<Platform>();
  coins = new ArrayList<Coin>();
  enemies = new ArrayList<Enemy>();

  platforms.add(new Platform(0, 550, 1000, 50));
  platforms.add(new Platform(150, 450, 180, 20));
  platforms.add(new Platform(400, 380, 180, 20));
  platforms.add(new Platform(650, 300, 180, 20));
  platforms.add(new Platform(300, 250, 150, 20));
  platforms.add(new Platform(100, 180, 150, 20));
  platforms.add(new Platform(550, 150, 180, 20));

  coins.add(new Coin(220, 410));
  coins.add(new Coin(470, 340));
  coins.add(new Coin(720, 260));
  coins.add(new Coin(360, 210));
  coins.add(new Coin(170, 140));
  coins.add(new Coin(620, 110));
  coins.add(new Coin(900, 510));
  coins.add(new Coin(80, 510));

  enemies.add(new Enemy(250, 520, 2, 0, 350));
  enemies.add(new Enemy(450, 350, 2, 400, 580));
  enemies.add(new Enemy(680, 270, 2, 650, 830));
}

void draw() {
  background(135, 206, 235);

  drawCloud(150, 100);
  drawCloud(400, 80);
  drawCloud(750, 120);

  fill(70, 180, 70);
  rect(0, 550, width, 50);

  if (!gameStart) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Coin Adventure Game", width/2, height/2 - 40);
    textSize(22);
    text("Press S to Start", width/2, height/2 + 10);
    text("Arrow keys to move and jump", width/2, height/2 + 50);
    return;
  }

  if (!gameOver && !gameWin) {
    player.update();
  }

  for (Platform p : platforms) {
    p.display();
  }

  for (Coin c : coins) {
    if (!c.collected) {
      c.display();
      if (player.collectCoin(c)) {
        c.collected = true;
        score++;
      }
    }
  }

  for (Enemy e : enemies) {
    if (!gameOver && !gameWin) {
      e.update();
    }
    e.display();

    if (player.hitEnemy(e) && frameCount % 20 == 0) {
      player.health--;
    }
  }

  player.display();

  fill(0);
  textSize(22);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  text("Health: " + player.health, 20, 50);

  if (score == totalCoins) {
    gameWin = true;
  }

  if (player.health <= 0 || player.y > height) {
    gameOver = true;
  }

  if (gameWin) {
    fill(0, 150, 0);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("You Win!", width/2, height/2);
    textSize(24);
    text("Press R to Restart", width/2, height/2 + 50);
  }

  if (gameOver) {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("Game Over", width/2, height/2);
    textSize(24);
    text("Press R to Restart", width/2, height/2 + 50);
  }
}

void keyPressed() {
  if (key == 's' || key == 'S') {
    gameStart = true;
  }

  if (keyCode == LEFT) {
    leftPressed = true;
  }
  if (keyCode == RIGHT) {
    rightPressed = true;
  }
  if (keyCode == UP) {
    upPressed = true;
  }

  if ((gameOver || gameWin) && (key == 'r' || key == 'R')) {
    restartGame();
  }
}

void keyReleased() {
  if (keyCode == LEFT) {
    leftPressed = false;
  }
  if (keyCode == RIGHT) {
    rightPressed = false;
  }
  if (keyCode == UP) {
    upPressed = false;
  }
}

void restartGame() {
  player = new Player(100, 450);
  score = 0;
  gameOver = false;
  gameWin = false;
  gameStart = false;

  coins.clear();
  enemies.clear();

  coins.add(new Coin(220, 410));
  coins.add(new Coin(470, 340));
  coins.add(new Coin(720, 260));
  coins.add(new Coin(360, 210));
  coins.add(new Coin(170, 140));
  coins.add(new Coin(620, 110));
  coins.add(new Coin(900, 510));
  coins.add(new Coin(80, 510));

  enemies.add(new Enemy(250, 520, 2, 0, 350));
  enemies.add(new Enemy(450, 350, 2, 400, 580));
  enemies.add(new Enemy(680, 270, 2, 650, 830));
}

void drawCloud(float x, float y) {
  fill(255);
  noStroke();
  ellipse(x, y, 60, 40);
  ellipse(x + 25, y - 10, 50, 35);
  ellipse(x + 50, y, 60, 40);
}

class Player {
  float x, y;
  float w, h;
  float vx, vy;
  float gravity;
  float jumpPower;
  boolean onGround;
  int health;

  Player(float x, float y) {
    this.x = x;
    this.y = y;
    w = 40;
    h = 50;
    vx = 0;
    vy = 0;
    gravity = 0.7;
    jumpPower = -12;
    onGround = false;
    health = 5;
  }

  void update() {
    vx = 0;

    if (leftPressed) {
      vx = -5;
    }
    if (rightPressed) {
      vx = 5;
    }

    x += vx;
    x = constrain(x, 0, width - w);

    vy += gravity;
    y += vy;

    onGround = false;

    for (Platform p : platforms) {
      if (x + w > p.x && x < p.x + p.w && y + h > p.y && y + h < p.y + p.h + 15 && vy >= 0) {
        y = p.y - h;
        vy = 0;
        onGround = true;
      }
    }

    if (upPressed && onGround) {
      vy = jumpPower;
    }
  }

  void display() {
    fill(255, 200, 0);
    rect(x, y, w, h);

    fill(0);
    ellipse(x + 12, y + 15, 5, 5);
    ellipse(x + 28, y + 15, 5, 5);
    line(x + 12, y + 35, x + 28, y + 35);
  }

  boolean collectCoin(Coin c) {
    return x + w > c.x - c.r && x < c.x + c.r && y + h > c.y - c.r && y < c.y + c.r;
  }

  boolean hitEnemy(Enemy e) {
    return x + w > e.x && x < e.x + e.w && y + h > e.y && y < e.y + e.h;
  }
}

class Platform {
  float x, y, w, h;

  Platform(float x, float y, float w, float h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  void display() {
    fill(120, 80, 40);
    rect(x, y, w, h);
  }
}

class Coin {
  float x, y;
  float r;
  boolean collected;

  Coin(float x, float y) {
    this.x = x;
    this.y = y;
    r = 12;
    collected = false;
  }

  void display() {
    fill(255, 215, 0);
    ellipse(x, y, r * 2, r * 2);
    fill(255, 240, 100);
    ellipse(x, y, r, r);
  }
}

class Enemy {
  float x, y;
  float w, h;
  float speed;
  float leftLimit, rightLimit;

  Enemy(float x, float y, float speed, float leftLimit, float rightLimit) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.leftLimit = leftLimit;
    this.rightLimit = rightLimit;
    w = 40;
    h = 40;
  }

  void update() {
    x += speed;

    if (x <= leftLimit || x + w >= rightLimit) {
      speed *= -1;
    }
  }

  void display() {
    fill(255, 0, 0);
    rect(x, y, w, h);

    fill(255);
    ellipse(x + 10, y + 12, 8, 8);
    ellipse(x + 30, y + 12, 8, 8);
    fill(0);
    ellipse(x + 10, y + 12, 3, 3);
    ellipse(x + 30, y + 12, 3, 3);
    line(x + 10, y + 30, x + 30, y + 30);
  }
}
