(function() {

  $(document).ready(function() {
    $("#tabs").tabs();

    class State {
      constructor(state) {
        this.state = 0 || state;
      }

      getStateName() {
        switch (this.state) {
          case 0: {
            return "ACTIVE";
          }
          case 1: {
            return "WON";
          }
          case 2: {
            return "LOST";
          }
          default: {
            return "INVALID";
          }
        }
      }
    }

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
        this.skips = 3;
        this.state = new State();
        this.currentColour = null;
        this.delta = {x: 0, y: 0};
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
      let keymap = {
        32: {
          aliases: [48, 96],
          useForKeyPress: true,
          func: function(canvas, keycode) {
            if (canvas.paused && [32, 48, 96].includes(p.keyCode)) {
              canvas.paused = false;
              canvas.speed = 1;
            } else {
              canvas.speed = 0;
              canvas.paused = true;
            }
          }
        },
        49: {
          aliases: [97],
          useForKeyPress: true,
          func: function(canvas, keyCode) {
            canvas.speed = 1;
            canvas.paused = false;
          }
        },
        50: {
          aliases: [98],
          useForKeyPress: true,
          func: function(canvas, keyCode) {
            canvas.speed = 2;
            canvas.paused = false;
          }
        },
        51: {
          aliases: [99],
          useForKeyPress: true,
          func: function(canvas, keyCode) {
            canvas.speed = 3;
            canvas.paused = false;
          }
        },
        65: /*A*/ {
          aliases: [p.LEFT_ARROW],
          useForKeyPress: false,
          func: function(canvas, keyCode) {
            let delta = {x: 0, y: 0};

            if (!(p.keyIsDown(p.LEFT_ARROW) && p.keyIsDown(p.RIGHT_ARROW))) {
              delta.x = -5;
            }

            canvas.paused = false;
            return delta;
          }
        },
        68: /*D*/ {
          aliases: [p.RIGHT_ARROW],
          useForKeyPress: false,
          func: function(canvas, keyCode) {
            let delta = {x: 0, y: 0};

            if (!(p.keyIsDown(p.LEFT_ARROW) && p.keyIsDown(p.RIGHT_ARROW))) {
              delta.x = 5;
            }

            canvas.paused = false;
            return delta;
          }
        },
        78: /*N*/ {
          aliases: [],
          useForKeyPress: false,
          func: function(canvas, keyCode, delta) {
            if (canvas.skips == 0 || canvas.objects.food.length <= 1)
              return;

            let new_foods = [];
            for (let i = 0; i < canvas.objects.food.length; i++) {
              food = canvas.objects.food[i];

            	if (food.colour === canvas.currentColour) {
                canvas.skips -= 1;
              	hasEaten = true;
            	}
              else {
                new_foods.push(food);
              }
            }

            canvas.currentColour = new_foods[0];
            canvas.objects.food = new_foods;
            $("span#skips").text(canvas.skips);
            setColour();
          }
        },
        83: /*S*/ {
          aliases: [p.DOWN_ARROW],
          useForKeyPress: false,
          func: function(canvas, keyCode) {
            let delta = {x: 0, y: 0};

            if (!(p.keyIsDown(p.UP_ARROW) && p.keyIsDown(p.DOWN_ARROW))) {
              delta.y = 5;
            }

            canvas.paused = false;
            return delta;
          }
        },
        87: /*W*/ {
          aliases: [p.UP_ARROW],
          useForKeyPress: false,
          func: function(canvas, keyCode) {
            let delta = {x: 0, y: 0};

            if (!(p.keyIsDown(p.UP_ARROW) && p.keyIsDown(p.DOWN_ARROW))) {
              delta.y = -5;
            }

            canvas.paused = false;
            return delta;
          }
        }
      }

      function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
      }

      function getRandomColor() {
        return {r: getRandomInt(255), g: getRandomInt(255), b: getRandomInt(255)};
      }

      function setColour() {
        let colour = canvas.currentColour;
        let grey = (colour.r + colour.g + colour.b) / 3;

        $("span#colour").css({
          color: `rgb(${colour.r},${colour.g},${colour.b})`,
          background: `rgb(${grey}, ${grey}, ${grey})`
        });
      }

      function checkState() {

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
        setColour();
      };
      p.draw = function() {
        let delta = {
          x: 0,
          y: 0
        };
        let hasMoved = false;
        let keyCode = p.keyCode;

        let wasPaused = canvas.paused;

        for (key in keymap) {
          let mapping = keymap[key];

          if (keyCode == key || mapping.aliases.includes(keyCode)) {
            delta = mapping.func(canvas, keyCode);
            if (!delta) {
              return;
            }
            break;
          }
        }

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

        hasMoved = delta.x || delta.y;
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

        canvas.objects.food = new_foods;
        if (canvas.objects.food.length == 0) {
          alert("You won!");
          canvas.won = true;
          return;
        }

        if (hasEaten)
          canvas.currentColour = new_foods[0].colour;

        canvas.hasEaten = hasEaten;

        if (canvas.score < 0) {
          alert("You lost!");
          canvas.lost = true;
        }

        if (hasMoved && canvas.hasEaten) {
          makeFood(canvas);
        }

        canvas.draw();
        canvas.delta = delta;
      };
      p.mousePressed = function() {
        canvas.paused = false;
        canvas.speed = 1;
        canvas.draw();
        $("span#speed").text(canvas.speed == 0 ? "Paused" : canvas.speed);
      }
      p.keyPressed = function() {
        let keyCode = p.keyCode;

        for (key in keymap) {
          let mapping = keymap[key];

          if (keyCode == key || mapping.aliases.includes(keyCode)) {
            if (mapping.useForKeyPress)
              mapping.func(canvas, keyCode);
            break;
          }
        }

        $("span#speed").text(canvas.speed == 0 ? "Paused" : canvas.speed);
        $("span#score").text(canvas.score);
        setColour();

        canvas.draw();

        return false;
      }
    }, 'game');
  });

})();
