(function() {

  $(document).ready(function() {
    $("#tabs").tabs();

    class Ball {
      constructor(parent, x, y, colour, diameter) {
        this.location = (x && y) ? {x: x, y: y} : {x: 25, y: 25};
        this.colour = colour || {r: 255, g: 0, b: 0};
        this.diameter = diameter || 25;
        this.parent = parent;
      }

      draw() {
        this.parent.fill(this.colour.r, this.colour.g, this.colour.b);
        this.parent.circle(this.location.x, this.location.y, this.diameter);
      }

      move(x, y, canvas) {
        let bounds = canvas.size;
        this.location = {x: this.location.x + x, y: this.location.y + y};

        if (this.location.x >= bounds.width)
          this.location.x = bounds.width - this.diameter;
        if (this.location.x <= 0)
          this.location.x = this.diameter;
        if (this.location.y >= bounds.height)
          this.location.y = bounds.height - this.diameter;
        if (this.location.y <= 0)
          this.location.y = this.diameter;
      }
    }

    class Bat extends Ball {
      constructor(parent, image, x, y) {
        super(parent, x, y);
        this.image = image;
      }

      draw() {
        this.parent.image(this.image, this.location.x, this.location.y, this.diameter, this.diameter);
      }
    }

    class Food extends Ball {
      constructor(parent, x, y, colour, diameter) {
        super(parent, x, y, colour, diameter);

        this.isFood = true;
        this.score = 1.5;
      }
    }

    class Canvas {
      constructor(parent, objects, size, background, speed) {
        this.parent = parent;
        this.background = background || {r: 200, g: 200, b: 200};
        this.speed = speed || 1;
        this.paused = false;
        this.hasEaten = false;
        this.score = 0;
        this.lost = false;
        this.won = false;
        this.currentColour = null;
        this.size = size || {width: 800, height: 400};
        this.objects = objects || {}; // associative array
      }

      draw() {
        this.parent.clear();
        this.parent.createCanvas(this.size.width, this.size.height);
        this.parent.background(this.background.r, this.background.g, this.background.g);

        for (let object in this.objects) {
          let obj = this.objects[object];

          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++)
              obj[i].draw();
          }
          else {
            obj.draw();
          }
        }
      }
    }

    new p5(function(p) {
      let bat, canvas;

      function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
      }

      function getRandomColor() {
        return {r: getRandomInt(255), g: getRandomInt(255), b: getRandomInt(255)};
      }

      function makeFood(canvas, init) {
        init = init || false;
        let j = getRandomInt(10) + (+init);
        if (!init && j % 2) return;

        let bounds = canvas.size;
        food = canvas.objects["food"] || [];

        for (let i = 0; i < j; i++) {
          let colour = getRandomColor();
          food.push(new Food(p,
             getRandomInt(bounds.width),
             getRandomInt(bounds.height),
             colour
          ));
          if (init)
            canvas.currentColour = colour;
        }

        canvas.objects.food = food;
      }

      p.preload = function() {
        let bat_image = p.loadImage('https://cdn.discordapp.com/avatars/657028134528483361/af464637208430b1843be46de7b8b304.png');

        bat = new Bat(p, bat_image);
        canvas = new Canvas(p, {"bat": bat});
      }
      p.setup = function() {
        canvas.draw();
        makeFood(canvas, true);
        $("span#colour").css({
          color: `rgb(${canvas.currentColour.r},${canvas.currentColour.g},${canvas.currentColour.b})`
        });
      };
      p.draw = function() {
        canvas.draw();

        if (canvas.lost) {
          p.textSize(30);
          p.fill(0);
          p.text("You lost :/", 5, 100);
          return;
        }

        if (canvas.won) {
          p.textSize(30);
          p.fill(0);
          p.text("You won :3", 5, 100);
          return;
        }

        if (canvas.paused) {
          p.textSize(30);
          p.fill(0);
          p.text("Game paused. Press Space to continue or click anywhere.", 5, 100);
          return;
        }

        let delta = {
          x: 0,
          y: 0
        };

        let hasMoved = false;

        if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(p.RIGHT_ARROW)) {
          if (!(p.keyIsDown(p.LEFT_ARROW) && p.keyIsDown(p.RIGHT_ARROW))) {
            delta.x = (p.keyIsDown(p.LEFT_ARROW) ? -1 : 1) * 5;
            hasMoved = true;
          }
        }

        if (p.keyIsDown(p.UP_ARROW) || p.keyIsDown(p.DOWN_ARROW)) {
          if (!(p.keyIsDown(p.UP_ARROW) && p.keyIsDown(p.DOWN_ARROW))) {
            delta.y = (p.keyIsDown(p.UP_ARROW) ? -1 : 1) * 5;
            hasMoved = true;
          }
        }

        bat.move(delta.x * canvas.speed, delta.y * canvas.speed, canvas);
        let new_foods = [];
        let hasEaten = false;
        for (let i = 0; i < canvas.objects.food.length; i++) {
          food = canvas.objects.food[i];

          let food_bonunds = {
            start_x: food.location.x,
            end_x: food.location.x + food.diameter,
            start_y: food.location.y,
            end_y: food.location.y + food.diameter
          };

          let bat_bounds = {
            start_x: bat.location.x,
            end_x: bat.location.x + bat.diameter,
            start_y: bat.location.y,
            end_y: bat.location.y + bat.diameter,
          }

          let intersect_raw = function(
            minAx, minAy, maxAx, maxAy,
            minBx, minBy, maxBx, maxBy) {
            return maxAx >= minBx && minAx <= maxBx && minAy <= maxBy && maxAy >= minBy;
          }

          let intersect = function(food, bat) {
            return intersect_raw(
              food.start_x, food.start_y, food.end_x, food.end_y,
              bat.start_x, bat.start_y, bat.end_x, bat.end_y
            );
          }

          if (intersect(food_bonunds, bat_bounds)) {
            console.log(food.colour);
            console.log(canvas.currentColour);

            if (food.colour === canvas.currentColour) {
              canvas.score += food.score * canvas.speed;
            }
            else {
              canvas.score -= food.score * canvas.speed;
            }

            hasEaten = true;
          }
          else {
            new_foods.push(food);
          }
        }

        if (hasEaten)
          canvas.currentColour = new_foods[0].colour;

        canvas.objects.food = new_foods;
        if (canvas.objects.food.length == 0) {
          alert("You won!");
          canvas.won = true;
        }

        canvas.hasEaten = hasEaten;

        if (canvas.score < 0) {
          alert("You lost!");
          canvas.lost = true;
        }

        if (hasMoved && canvas.hasEaten) {
          makeFood(canvas);
        }
      };
      p.mousePressed = function() {
        canvas.paused = false;
        canvas.speed = 1;
        canvas.draw();
        $("span#speed").text(canvas.speed == 0 ? "Paused" : canvas.speed);
      }
      p.keyPressed = function() {
        if (p.keyCode == 32 || p.keyCode == 48 || p.keyCode == 96) {
          if (canvas.paused && p.keyCode == 32) {
            canvas.paused = false;
            canvas.speed = 1;
          } else {
            canvas.speed = 0;
            canvas.paused = true;
          }
        }
        else if (canvas.paused) {
          return;
        }
        else if (p.keyCode == 49 || p.keyCode == 97) {
          canvas.speed = 1;
          canvas.paused = false;
        }
        else if (p.keyCode == 50 || p.keyCode == 98) {
          canvas.speed = 2;
          canvas.paused = false;
        }
        else if (p.keyCode == 51 || p.keyCode == 98) {
          canvas.speed = 3;
          canvas.paused = false;
        }

        $("span#speed").text(canvas.speed == 0 ? "Paused" : canvas.speed);
        $("span#score").text(canvas.score);
        $("span#colour").css({
          color: `rgb(${canvas.currentColour.r},${canvas.currentColour.g},${canvas.currentColour.b})`
        });
      }
    }, 'game');
  });

})();
