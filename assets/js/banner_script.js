// Banner Credit CodePen User: satchmorun <https://codepen.io/satchmorun/pen/OyxJme>
// To Adjust Banner Image
// Speed: Line 43 -> setTimeout on loop call
// Background - Color: Line 289 
// Line - Color: Line 289 
// Zoom: Line 263 -> dpr parameter


document.addEventListener("DOMContentLoaded", () => {

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    'floor|ceil|random|round|abs|sqrt|PI|atan2|sin|cos|pow|max|min'
    .split('|')
    .forEach(function(p) { window[p] = Math[p]; });

    var TAU = PI*2;

    function r(n) { return random()*n; }
    function rrng(lo, hi) { return lo + r(hi-lo); }
    function rint(lo, hi) { return lo + floor(r(hi - lo + 1)); }
    function choose() { return arguments[rint(0, arguments.length-1)]; }
    function choose1(arr) { return arr[rint(0, arr.length-1)]; }

    /*---------------------------------------------------------------------------*/

    var W, H, frame, t0, time, stop;
    var DPR = devicePixelRatio;

    function dpr(n) { return n * DPR; }

    function resize() {
    var w = innerWidth;
    // var h = innerHeight;
    var h = 400;
    
    // canvas.style.width = w+'px';
    // canvas.style.height = h+'px';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    W = canvas.width = w * DPR;
    H = canvas.height = h * DPR;
    }

    function loop(t) {
        if (!stop) {
            frame = requestAnimationFrame(() => setTimeout(loop, 40));
            draw();
            time++;
        }
    }

    function pause() {
        cancelAnimationFrame(frame);
        stop = true;
        frame = null;
    }

    function play() {
        frame = frame || requestAnimationFrame(loop);
    }

    function reset() {
        cancelAnimationFrame(frame);
        resize();
        ctx.clearRect(0, 0, W, H);
        init();
        time = 0;
        stop = false;
        frame = requestAnimationFrame(loop);
    }

    /*---------------------------------------------------------------------------*/



    function Lattice(w, h, res) {
    this.w = w;
    this.h = h;
    this.res = res;
    var ncols = this.ncols = ceil(w / res);
    var nrows = this.nrows = ceil(h / res);
    this.bins = new Array(ncols);
    for (var i = 0; i < ncols; i++) {
        this.bins[i] = new Array(nrows);
        for (var j = 0; j < nrows; j++) {
        var bin = this.bins[i][j] = new Array(NODES_PER_BIN);
        for (var k = 0; k < bin.length; k++) {
            var x = i * res;
            var y = j * res;
            bin[k] = new Node(this, rint(x, x+res), rint(y, y+res));
        }
        }
    }
    }

    Lattice.prototype.findAFriend = function(node, n) {
    var col = floor(node.x / this.res);
    var row = floor(node.y / this.res);
    var bins = [];
    var bin;
    
    for (var c = col-1; c <= col+1; c++) {
        var cc = this.bins[c];
        if (!cc) continue;
        for (var r = row-1; r <= row+1; r++) {
        bin = cc[r];
        if (Array.isArray(bin)) bins.push(bin);      
        }
    }
    var friends = new Array(n);
    while (n--) friends[n] = choose1(choose1(bins));
    return friends;
    };

    Lattice.prototype.findNearest = function(p) {
    var col = floor(p.x / this.res);
    var row = floor(p.y / this.res);
    var d2 = Infinity;
    var bin, closest;
    
    for (var c = col-1; c <= col+1; c++) {
        var cc = this.bins[c];
        if (!cc) continue;
        for (var r = row-1; r <= row+1; r++) {
            bin = cc[r];
            if (!Array.isArray(bin)) return;
            for (var i = 0; i < NODES_PER_BIN; i++) {
                var noded2 = bin[i].d2(p);
                if (noded2 < d2) {
                    closest = bin[i];
                    d2 = noded2;
                }
            }
        }
    }
    return closest;
    };

    Lattice.prototype.each = function(cb) {
        for (var c = 0; c < this.ncols; c++) {
            for (var r = 0; r < this.nrows; r++) {
                var bin = this.bins[c][r];
                for (var i = 0; i < NODES_PER_BIN; i++) {
                    cb(bin[i]);
                }
            }
        }
    };

    Lattice.prototype.eachActive = function(cb) {
        this.each(function(node) {
            if (!node.isActive) return;
            cb(node);
        });
    };

    function Node(lattice, x, y) {
        this.lattice = lattice;
        this.x = x;
        this.y = y;
        this.isActive = false;
        this.activatedAt = 0;
        this.friends = [];
        this.p = 1;
    }

    Node.prototype.activate = function(t, p) {
        this.isActive = true;
        this.activatedAt = t;
        this.friends = this.lattice.findAFriend(this, 3);
        this.p = p;
    };

    Node.prototype.update = function(t) {
        this.p *= DECAY;
        var p = this.p;
        if (this.isActive && (t - this.activatedAt >= 2)) {
            this.isActive = false;
            this.friends.forEach(function(friend) {
            if (random() < p) friend.activate(t, p);
            });
        }
    };

    Node.prototype.d2 = function(p) {
        var dx = this.x - p.x;
        var dy = this.y - p.y;
        return dx*dx + dy*dy;
    };

    function Arr(n) {
        this.arr = new Array(n);
        this.len = 0;
    }

    Arr.prototype.push = function(x) { this.arr[this.len++] = x; };
    Arr.prototype.concat = function(a) { 
        for (var i = 0; i < a.length; i++) this.push(a[i]);
    };
    Arr.prototype.clear = function() { this.len = 0; };
    Arr.prototype.each = function(cb) {
        for (var i = 0; i < this.len; i++) cb(this.arr[i]);
    };

    /*---------------------------------------------------------------------------*/

    function Circle(r, x, y, vx, vy) {
        this.r = r;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    Circle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, TAU);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(123, 123, 123, 0.4)';
        ctx.stroke();
    };

    Circle.prototype.intersections = function(other) {
        var dx = this.x - other.x;
        var dy = this.y - other.y;
        var d = sqrt(dx*dx + dy*dy);

        if (d >= this.r + other.r) return [];
        if (d < abs(this.r - other.r)) return [];

        var a = (this.r*this.r - other.r*other.r + d*d) / (2 * d);

        var x = this.x - (dx*a/d);
        var y = this.y - (dy*a/d);

        var h = sqrt(this.r*this.r - a*a);

        var rx = -dy*h/d;
        var ry = dx*h/d;

        return [
            {x: x+rx, y: y+ry},
            {x: x-rx, y: y-ry}
        ];
    };

    /*---------------------------------------------------------------------------*/

    var N = 10000;
    var P;
    var ons;
    var lattice;
    var NODES_PER_BIN = 1;
    var DECAY = 0.97;

    var C = 20;
    var circles = new Array(C);
    var intersections = new Arr(C*C);

    function init() {
        var res = dpr(25);
        lattice = new Lattice(W, H, res);  
        ons = new Arr(floor((W/res) * (H/res) * NODES_PER_BIN));
        
        var mindim = min(W, H);
        
        for (var i = 0; i < C; i++) {
            circles[i] = new Circle(rint(floor(mindim/8), floor(mindim/4)), 
                                    rint(0, W), rint(0, H), 
                                    rrng(dpr(-2), dpr(2)), rrng(dpr(-2), dpr(2)));
        }
        circles[C++] = new Circle(floor(mindim/4), W/2, H/2, 0, 0);
    }

    function draw() { 
        ctx.fillStyle = 'rgba(34, 49, 63, 0.2)';
        ctx.fillRect(0, 0, W, H);
        updateCircles();
        activateIntersections();
        
        lattice.eachActive(function(node) { node.update(time); });
        ons.clear();
        lattice.eachActive(function(node) {
            if (!node.isActive) return;
            ons.push(node);
        });  
        drawLines(ons, 'rgba(93,202,74, 0.3)', dpr(0.5));


        /*for (var i = 0; i < C; i++) {
            circles[i].draw();
        }*/
    }

    function updateCircles() {
    var i, j, a, x;    
    intersections.clear();

    for (i = 0; i < C; i++) {
        a = circles[i];

        // Check the walls
        if (a.x <= -a.r) a.x = W + a.r; else if (a.x >= W + a.r) a.x = -a.r;
        if (a.y <= -a.r) a.y = H + a.r; else if (a.y >= H + a.r) a.y = -a.r;


        for (j = i+1; j < C; j++) {
        var ixs = a.intersections(circles[j]);
        if (ixs.length) {
            intersections.push(ixs[0]);
            intersections.push(ixs[1]);
        }
        }

        a.x += a.vx;
        a.y += a.vy;
    }
    }

    function activateIntersections() {
    intersections.each(function(ix) {
        var node = lattice.findNearest(ix);
        if (node) node.activate(time, 1.5);
    });
    }

    function drawLines(nodes, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        nodes.each(function(node) {
            node.friends.forEach(function(friend) {
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(friend.x, friend.y);
            });
        });
        ctx.closePath();
        ctx.stroke();
    }


    /*---------------------------------------------------------------------------*/
    canvas.onclick = function() {
        if (frame) {
            pause();
        } else {
            reset();
        }
    };
    reset();
});