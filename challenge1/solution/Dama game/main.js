(function () {
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
            
            var aArgs = Array.prototype.slice.call(arguments, 1), 
                fToBind = this, 
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis
                            ? this
                            : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();
            
            return fBound;
        };
    }

    if (Element.prototype.addEventListener || !Object.defineProperty) {
        return;
    }
    
    var proto = document.createEventObject().constructor.prototype;
    
    Object.defineProperty(proto, 'target', {
        get: function() { return this.srcElement; }
    });
    
    var addEventListenerFunc = function(type, handler) {

        var fn = handler;
        
        if (!('on' + type in this)) {
            this.__elemetIEid = this.__elemetIEid || '__ie__' + Math.random();
            var customEventId = type + this.__elemetIEid;
            document.documentElement[customEventId];
            var element = this;
            
            document.documentElement.attachEvent('onpropertychange', 
            function (event) {
                
                if (event.propertyName === customEventId) {
                    fn.call(element, document.documentElement[customEventId]);
                }
            });
            return;
        }
    
        this.attachEvent('on' + type, fn.bind(this));
    };
    
    // setup the DOM and window objects
    HTMLDocument.prototype.addEventListener = addEventListenerFunc;
    Element.prototype.addEventListener = addEventListenerFunc;
    window.addEventListener = addEventListenerFunc;
    
    CustomEvent = function (type, obj) {
        obj = obj || {};
        obj.name = type;
        obj.customEvent = true;
        return obj;
    };
    
    MouseEvent = function (type, obj) {
        var event = document.createEventObject();
        event.type = 'on' + type;
        for (var prop in obj) {
            event[prop] = obj[prop];
        }
        return event;
    };
    
    var dispatchEventFunc = function (e) {
        if (!e.customEvent) {
            this.fireEvent(e.type, e);
            return;
        }
        // no event registred
        if (!this.__elemetIEid) {
            return;
        }
        var customEventId = e.name + this.__elemetIEid;
        document.documentElement[customEventId] = e;
    };
    
    // setup the Element dispatchEvent used to trigger events on the board
    HTMLDocument.prototype.dispatchEvent = dispatchEventFunc;
    Element.prototype.dispatchEvent = dispatchEventFunc;
    window.dispatchEvent = dispatchEventFunc;
})();

var modernBrowser = 'forEach' in Array.prototype;

if (!modernBrowser) {
    var builtinSlice = Array.prototype.slice;
    Array.prototype.slice = function(action, that) {
        'use strict';
        var arr = [];
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                arr.push(this[i]);
                
        return builtinSlice.apply(arr, arguments);
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function(action, that) {
        'use strict';
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                action.call(that, this[i], i);
    };
}
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, ''); 
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisArg */) {
        'use strict';
        
        if (this === void 0 || this === null)
            throw new TypeError();
        
        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != 'function')
            throw new TypeError();
        
        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];
                if (fun.call(thisArg, val, i, t)) res.push(val);
            }
        }
        
        return res;
    };
}
(function () {

    // Helpers
    
    function removeClass(el, className) {
        
        el.className = el.className.replace(className, '').trim();
    }
    
    function queryField(line, column) {
        
        return 'div.line' + line + '.column' + column;
    }
    
    function closestClassMatchElement(element, match) {
        
        var el = element;
        while(el.className.match(match) === null && el.parentElement) {
            el = el.parentElement;
        }
        if (!el.className.match(match)) {
            return;
        }
        return el;
    }
    
    function closestPieceElement(element) {
        
        return closestClassMatchElement(element, /player([0-9])/i);
    }

    function DraughtsBoard(opt) {
        if (typeof opt !== 'object') {
            opt = {};
        }
        
        // Setup the HTMLElement to be the board
        this.element = opt.element || document.createElement('div');
        
        if (this.element.size) {
            var parentEl = this.element.parentElement;
            var oldEl = this.element;
            this.element = document.createElement('div');
            this.element.id = oldEl.id;
            this.element.className = oldEl.className;
            if (parentEl) {
                parentEl.insertBefore(this.element, oldEl);
                parentEl.removeChild(oldEl);
            }
            
        }
        
        this.element.data = this;
        
        var size = !isNaN(opt.size) && (+ opt.size) % 2 === 0 ? + opt.size : 8;
        if (size < 5) {
            throw new Error('Board size must be greater then 5');
        }
        
        // Size is a constant from the board
        Object.defineProperty(this.element, 'size', {
            get: function () {
                return size;
            }
        });
        
        // Number of turns played
        var turn = Number(opt.turn) || 0;
        Object.defineProperty(this.element, 'turn', {
            get: function () {
                return turn;
            },
            set: function (val) {
                if (isNaN(val)) throw new Error('Invalid turn');
                var old = turn;
                turn = + val;
    
                // It's useful old value from turn to validate if you jump over
                // turns for future online features
                var event = new CustomEvent('changeturn', { 'detail': {
                    oldValue: old,
                    value: turn
                }});
    
                // trigger draughts
                this.dispatchEvent(event);
            }
        });
        
        // setup the game map
        if (opt.map instanceof Array) {
            this.element.map = opt.map;
        }
        
        // Default triggers
        this.element.addEventListener('addedfield', function (event) {
            // When a field is added to the board, setup it 
            
            if (event.defaultPrevented) {
                return;
            }
            
            var pos = event.detail.position;
            var fieldEl = event.detail.field.element;
            var s = 100 / this.size;
            
            // Set the field size idependent of CSS, allow any size board
            var style = 'width: ' + s + '%;height: ' + s + '%;';
            fieldEl.setAttribute('style', style);
            
            // Check if the field need to be disabled (white color)
            if (!(pos % 2 === (pos / this.size << 0) % 2)) {
                fieldEl.className = 'white';
                return;
            }
            
            event = new CustomEvent('addpiece', {
                'detail': event.detail
            });
    
            // Each field dispatch a addedfield event
            this.dispatchEvent(event);
        });
        
        this.element.addEventListener('addpiece', function (event) {
            // When a field is added to the board, append the player piece 
            
            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var position = event.detail.position;
            var piece;
            
            if (!this.map) {
                // Create a new game from the default start
                if (position < (this.size * this.size / 2) - this.size) {
                    piece = new DraughtsPiece({
                        player: 0
                    });
                }
                
                if (position >= (this.size * this.size / 2) + this.size) {
                    piece = new DraughtsPiece({
                        player: 1
                    });
                }
                
            } else {
                var rule = this.map[event.detail.line]
                if (!rule) {
                    return;
                }
                rule = rule[event.detail.column];
                if (!rule) {
                    return;
                }
                if (rule > 0 && rule < 3) {
                    piece = new DraughtsPiece({
                        player: (rule % 2) ^ 1
                    });
                } else {
                    piece = new DraughtsPieceQueen({
                        player: (rule % 2) ^ 1
                    });
                }
            }
            
            if (piece) {
                event.detail.field.element.appendChild(piece.element);
                piece.board = this;
                
                event.detail.piece = piece;
                event = new CustomEvent('addedpiece', {
                    'detail': event.detail
                });
        
                // Each field dispatch a addedfield event
                this.dispatchEvent(event);
            }
            
        });
        
        this.element.addEventListener('created', function (event) {
            // When a finish creating the board, change the turn to 1
    
            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
    
            this.turn++;
        });
        
        this.element.addEventListener('changeturn', function (event) {
            // When change a turn, re-calculate the possible moves
    
            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
    
            var player = event.detail.value % 2 ^ 1;
            
            this.data.removeAllMasks();
            
            // Select other player pieces (IE8 not support attr selector)
            var pieces = this.data.playerPieces(player ^ 1);
            
            // Remove href and focus from other player pieces
            pieces.forEach(function (piece) {
                piece.data.denyMove();
            });
            
            // Select current player pieces
            pieces = this.data.playerPieces(player);
            
            // Store allowed attacks and moves
            var attacks = [];
            var moves = [];
            
            // Check for allowed moviments
            pieces.forEach(function (piece) {
                if (piece.data.allowedAttacks().length > 0) {
                    attacks.push(piece);
                }
                if (piece.data.allowedMoves().length > 0) {
                    moves.push(piece);
                }
            });
            
            if (attacks.length > 0) {
                attacks.forEach(function (piece) {
                    piece.data.allowMove();
                });
            }
            
            if (moves.length > 0) {
                moves.forEach(function (piece) {
                    piece.data.allowMove();
                });
                return;
            }
            
            var gameoverEvent = new CustomEvent('gameover', { 'detail': {
                winner: player ^ 1,
                motive: 'no_more_moves',
                turn: turn - 1
            }});
            
            // trigger draughts
            this.dispatchEvent(gameoverEvent);
        });
        
        this.element.addEventListener('mousedown', function (event) {
            // Focus the piece when click on it (when it's possible)

            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var piece = closestPieceElement(event.target || event.srcElement);
            
            if (!piece) {
                return;
            }
            piece.focus();
        });
        
        function pieceHoldDispatcher(event) {
            // If clicking in a piece, dipatch piecehold if is possible

            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var piece = closestPieceElement(event.target || event.srcElement);
            
            if (!piece || !piece.parentElement) {
                return;
            }
            
            if (!piece.getAttribute('href')) {
                return;
            }
            
            // Trigger a piece hold event
            var event = new CustomEvent('piecehold', { 'detail': {
                piece: piece,
                field: piece.parentElement
            }});

            // trigger draughts
            this.dispatchEvent(event);
        }
        
        this.element.addEventListener('mousedown', pieceHoldDispatcher);
        this.element.addEventListener('click', pieceHoldDispatcher);
        
        var dragging;
        this.element.addEventListener('mousedown', function (event) {
            // If clicking in a piece, dipatch piecehold if is possible

            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var piece = closestPieceElement(event.target || event.srcElement);
            
            if (!piece) {
                return;
            }
            
            if (piece.className.indexOf('focus') === -1) {
                return;
            }
            
            dragging = {
                piece: piece,
                x: event.clientX,
                y: event.clientY
            };
            piece.className += ' startdrag';
        });
        
        this.element.addEventListener('mousemove', function (event) {
            if (!dragging) {
                return;
            }
            
            var field = dragging.piece.parentElement;
            
            var x = event.clientX - dragging.x;
            var y = event.clientY - dragging.y;
            
            dragging.piece.style.left = x + 'px';
            dragging.piece.style.top = y + 'px';
            
            var masks = this.querySelectorAll('.move');
            
            dragging.mask = undefined;
            Array.prototype.slice.call(masks).forEach(function (mask) {
                mask.blur();
                if (!(mask.offsetTop < event.clientY)) {
                    return;
                }
                if (!(mask.offsetTop + mask.offsetHeight > event.clientY)) {
                    return;
                }
                if (!(mask.offsetLeft < event.clientX)) {
                    return;
                }
                if (!(mask.offsetLeft + mask.offsetWidth > event.clientX)) {
                    return;
                }
                dragging.mask = mask;
                mask.focus();
            });
        });

        this.element.addEventListener('mouseup', function (event) {
            // If clicking in a piece, dipatch piecehold if is possible

            // no default just leave...
            if (event.defaultPrevented || !dragging) {
                return;
            }
            
            var piece = dragging.piece;
            piece.className = piece.className.replace('startdrag', '');
            piece.style.left = '';
            piece.style.top = '';
            
            if (dragging.mask) {
                var clickEvent = new MouseEvent('click', {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true,
                    'target': piece
                });
                
                dragging.mask.dispatchEvent(clickEvent);
            }
            
            dragging = undefined;
        });
        
        this.element.addEventListener('click', function (event) {
            // If clicking in a mask, dipatch piecerelease if is holding a piece

            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            event.target = event.target || event.srcElement;
            var mask = closestClassMatchElement(event.target, /move/i);
            if (!mask || !mask.parentElement) {
                return;
            }
            
            var piece = this.querySelector('a.focus');
            if (!piece) {
                return;
            }
            
            var field = mask.parentElement;
            
            // Trigger a piece hold event
            var event = new CustomEvent('piecerelease', { 'detail': {
                piece: piece,
                destine: field,
                mask: mask
            }});

            // trigger draughts
            this.dispatchEvent(event);
        });
        
        var holding;
        this.element.addEventListener('piecehold', function (event) {
            // Hold the piece to be able to move it in the board, will add the
            // possible moves and attacks masks in the field
            
            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var piece = event.detail.piece;
            
            // workaround for IE8 focus
            var selectedFields = this.querySelectorAll('a.focus');
            Array.prototype.slice.call(selectedFields).forEach(function (el) {
                removeClass(el, 'focus');
            });
            
            piece.className += ' focus';
            piece.focus();
            
            this.data.removeAllMasks();
            
            var attacks = piece.data.allowedAttacks();
            if (attacks.length > 0) {
                // add masks to allowed attacks fields
                attacks.forEach(function (attack) {
                    attack.field.data.addMask({
                        attack: attack.opponent
                    });
                });

            }
            
            var moves = piece.data.allowedMoves();
            if (moves.length > 0) {
                moves.forEach(function (field) {
                    field.data.addMask();
                });
            }
        });
        
        this.element.addEventListener('piecerelease', function (event) {
            // Release piece in some field mask, do the action (move or attack)
            
            // no default just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            var piece = event.detail.piece;
            
            holding = false;
            
            this.data.removeAllMasks();
            
            piece.data.moveTo(event.detail.destine, event.detail.mask);
        });
        
        this.element.addEventListener('piecemove', function (event) {
            // When the move is an attack dispatch a attack event and check if 
            // can still attacking with the same piece, if so, then avoid 
            // changeTurn

            var piece = event.detail.piece;
            var mask = event.detail.mask;
            var toField = event.detail.toField;
            var fromField = event.detail.fromField;
            
            // mask has opponent details?
            if (!mask.data.opponent.length === 0) {
                return;
            }
            
            var isAttack;
            mask.data.opponent.forEach(function (opponent) {
                // Attack the opponent
                
                piece.data.attack(opponent, fromField, toField);
                isAttack = true;
            });
            
            if (!isAttack) {
                return;
            }
            
            piece.data.attackTurn++;
            var attacks = piece.data.allowedAttacks();
            
            if (attacks.length > 0) {
                event.detail.changeTurn = false;
            }

            // Remove href and focus from other pieces
            this.data.playerPieces(piece.data.player()).forEach(function (p) {
                if (piece === p) {
                    return;
                }
                p.data.denyMove();
            })
            
            // This will help to show what is your new allowed moves
            var clickEvent = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true,
                'target': piece
            });
            
            piece.dispatchEvent(clickEvent);
        });
        
        this.element.addEventListener('piecemove', function (event) {
            // Check if hit the other border of board and transform a piece in
            // a queen piece
            
            var piece = event.detail.piece;
            var toField = event.detail.toField;
            
            var bottomBorder = toField.data.line === this.size - 1;
            var topBorder = toField.data.line === 0;
            
            if (!bottomBorder && !topBorder) {
                return;
            }
            
            var playerId = piece.data.player();
            
            if (playerId === 0 && !bottomBorder) {
                return;
            }
            if (playerId === 1 && !topBorder) {
                return;
            }
            
            new DraughtsPieceQueen({
                extend: piece
            });
        });
        
        // Create the board
        // but a ticker after register listeners from the instance creator...
        setTimeout(this.create.bind(this), 4);
    }
    
    DraughtsBoard.prototype = {
        // no Object.observer... No problem! Let's use the element to have event
        // listeners
        addEventListener: function () {
            // Bind addEventListener
    
            this.element.addEventListener.apply(this.element, arguments);
        },
        dispatchEvent: function () {
            // Bind dispatchEvent
    
            this.element.dispatchEvent.apply(this.element, arguments);
        },
        size: function () {
            // Bind dispatchEvent
    
            return this.element.size;
        },
        destroy: function () {
            // Remove all childrens from the board
    
            while (this.element.children.length > 0) {
                this.element.removeChild(this.element.children[0]);
            }
            
            var event = new CustomEvent('destroyboard');
    
            // trigger draughts
            this.element.dispatchEvent(event);
        },
        create: function () {
            // Create the board based on the options passed
            
            // Before create remove all childrens
            if (this.element.children.length > 0) {
                this.destroy();
            }
            
            var size = this.size();
            var event;
            
            for (var i = 0; i < size * size; i++) {
                var field = new DraughtsBoardField(i / size << 0, i % size);
                
                // Append field element as board element children
                this.element.appendChild(field.element);
                
                event = new CustomEvent('addedfield', {
                    'detail': {
                        field: field,
                        position: i,
                        line: field.line,
                        column: field.column
                    }
                });
    
                // Each field dispatch a addedfield event
                this.element.dispatchEvent(event);
            }
            
            event = new CustomEvent('created');
    
            // After create all fields dispatch created
            this.element.dispatchEvent(event);
        },
        removeAllMasks: function () {
            // Remove all masks in the board
            
            var mask = this.element.querySelectorAll('a.move');
            Array.prototype.slice.call(mask).forEach(function (mask) {
                // Ensure it's on DOM
                if (mask.parentElement) {
                    // And remove it...
                    mask.parentElement.removeChild(mask);
                }
            });
        },
        playerPieces: function(id) {
            var pieces = this.element.querySelectorAll('a.player' + id);
            return Array.prototype.slice.call(pieces);
        },
        map: function () {
            // Export the game pieces positions to a array map
            var map = [];
            //TODO: for in board, each line is a new array
            
            return map;
        }
    };
    
    function DraughtsBoardField(line, column) {
        // Data from a Field element of a DraughtsBoard
        
        var field = document.createElement('div');
        this.element = field;
        field.data = this;
        
        this.line = line;
        this.column = column;
        
        // Add class to the field, let search using querySelector
        field.className += ' line' + line;
        field.className += ' column' + column;
    }
    
    DraughtsBoardField.prototype = {
        addMask: function (opt) {
            // Create and append a mask that allow focus, click or dragevent
            // options:
            //  - attack: piece element or array of piece elements
            
            var mask = document.createElement('a');
            mask.className = 'move';
            mask.setAttribute('href', 'javascript: ');
            
            opt = opt || {};
            mask.data = {
                opponent: []
            };
            
            // Register attacked pieces in the mask
            if (opt.attack) {
                if (opt.attack instanceof Array) {
                    mask.data.opponent = mask.data.opponent.concat(opt.attack);
                } else {
                    mask.data.opponent.push(opt.attack);
                }
            }
            
            this.element.appendChild(mask);
        },
        removeMask: function () {
            // Remove the mask from the field

            var mask = this.element.querySelector('a.move');
            if (!mask) {
                return;
            }
            this.element.removeChild(mask);
        }
    };
    
    function DraughtsPiece(opt) {
        // Player piece constructor
        
        this.attackTurn = 0;
        
        // piece element
        this.element = document.createElement('a');
        this.element.data = this;
        
        // Inside div for design
        var div = document.createElement('div');
        div.appendChild(document.createElement('div'));
        this.element.appendChild(div);
        
        // Setup the player class
        if (!opt.player) {
            this.element.className += ' player0';
        } else {
            this.element.className += ' player1';
        }
    }
    
    DraughtsPiece.prototype = {
        player: function () {
            // Return number from player id
            
            return + this.element.className.match(/player([0-9])/i)[1];
        },
        denyMove: function () {
            // Remove user interaction attributes for the piece
            
            this.element.removeAttribute('href');
            removeClass(this.element, 'focus');
        },
        allowMove: function () {
            // Add user interaction attributes for the piece
            
            // allow click, touch and spatial navigator
            this.element.setAttribute('href', 'javascript: ');
        },
        allowedMoves: function (field) {
            // Return array of fields allowed to this piece moveTo
            
            return this.findNextFields(field).filter(function (el) {
                return el.children.length === 0;
            });
        },
        allowedAttacks: function (field, allowBackwardAttack) {
            // Return a list of objects contain the destine field and opponent
            // piece
            
            var opponentId = this.player() ^ 1;
            
            var attacks = [];
            var isABK = allowBackwardAttack;
            if (!allowBackwardAttack) {
                isABK = this.board.allowBackwardAttack && this.attackTurn > 0;
            }
            
            this.findNextFields(field, isABK).forEach(function (atkField) {
                var opponent = atkField.querySelector('a.player' + opponentId);
                
                if (!opponent) {
                    return;
                }
                
                var dir = isABK;
                if (isABK) {
                    var pieceField = this.element.parentElement.data.line;
                    // find direction
                    dir = !((pieceField > atkField.data.line) ^ opponentId);
                }
                
                this.findNextFields(atkField, dir).forEach(function (movField) {
                    if (movField.children.length !== 0) {
                        return;
                    }
                    attacks.push({
                        field: movField,
                        opponent: opponent
                    });
                });
            }.bind(this));
            
            return attacks;
        },
        findNextFields: function (field, backward) {
            // Check near field possible moves, if is the same as piece will

            var currentField = this.element.parentElement;
            field = field || currentField;
            var line = field.data.line;
            var column = field.data.column;
            
            var playerId = this.player();
            
            if (playerId === 0) {
                line++;
            } else {
                line--;
            }
            
            var query = [];
            
            if (field === currentField) {
                query.push(queryField(line, column - 1));
                query.push(queryField(line, column + 1));
            } else {
                if (currentField.data.column < column) {
                    query.push(queryField(line, column + 1));
                } else {
                    query.push(queryField(line, column - 1));
                }
            }
            if (backward) {
                if (playerId === 0) {
                    line -= 2;
                } else {
                    line += 2;
                }
                if (field === currentField) {
                    query.push(queryField(line, column - 1));
                    query.push(queryField(line, column + 1));
                } else {
                    query = [];
                    if (currentField.data.column < column) {
                        query.push(queryField(line, column + 1));
                    } else {
                        query.push(queryField(line, column - 1));
                    }
                }
            }

            var fields = this.board.querySelectorAll(query.join(','));
            return Array.prototype.slice.call(fields);
        },
        moveTo: function (field, mask) {
            // Move a piece in the board
            
            // Create a move event
            var event = new CustomEvent('piecemove', { 'detail': {
                piece: this.element,
                fromField: this.element.parentElement,
                toField: field,
                mask: mask,
                turn: this.board.turn,
                changeTurn: true
            }});
            
            field.appendChild(this.element);
            
            // trigger board
            this.board.dispatchEvent(event);
            if (event.detail.changeTurn) {
                // Change the player turn
                this.attackTurn = 0;
                this.board.turn++;
            }
        },
        attack: function (opponent, fromField, toField) {
            
            // Create a attack event
            var event = new CustomEvent('pieceattack', { 
                'cancelable': true,
                'detail': {
                    piece: this.element,
                    opponent: opponent,
                    field: opponent.parentElement,
                    fromField: fromField,
                    toField: toField,
                    turn: this.board.turn
                }
            });
            
            // trigger board
            this.board.dispatchEvent(event);
            
            // no default? just leave...
            if (event.defaultPrevented) {
                return;
            }
            
            // As default it removes the attacked oponent from the board
            if (opponent.parentElement) {
                opponent.parentElement.removeChild(opponent);
            }
        }
    };
    
    function DraughtsPieceQueen(opt) {
        var piece = opt.extend;
        
        if (piece && piece.data && piece.data instanceof DraughtsPieceQueen) {
            return;
        }
        
        if (!piece) {
            piece = (new DraughtsPiece(opt)).element;
        }
        
        this.extend = piece.data;
        
        piece.data = this;
        this.element = piece;
        
        piece.className += ' queen';
        
        for (var prop in this.extend) if (this.extend.hasOwnProperty(prop)) {
            this[prop] = this.extend[prop];
        }
        
        var lastEl = piece.querySelectorAll('*');
        lastEl = lastEl[lastEl.length - 1];
    }
    
    function DraughtsPieceQueenPrototype() {
        this.allowedMoves = function (field) {
            // Queen always can walkback

            var moves = this.findNextFields(field, true).filter(function (el) {
                return el.children.length === 0;
            });
            
            if (this.board.allowQueenRun) {
                for (var i = 0; i < moves.length; i++) {
                    var line = this.element.parentElement.data.line;
                    var dir = moves[i].data.line > line;
                    dir = dir ^ (this.player() ^ 1);
                    var fields = this.findNextFields(moves[i], dir)
                                        .filter(function (el) {
                        return el.children.length === 0;
                    });
                    if (fields.length === 0) {
                        continue;
                    }
                    moves.push(fields[0]);
                }
            }
            
            return moves;
        };
        this.allowedAttacks = function () {
            var arr = Array.prototype.slice.call(arguments);
            arr[1] = true;
            var attacks = DraughtsPiece.prototype.allowedAttacks.apply(this, arr);
            
            var moves = this.allowedMoves();
            //TODO: Incrase the eficience in this loop... Is necessary iterate all?
            moves.forEach(function (field) {
                var line = this.element.parentElement.data.line;
                var dir = field.data.line > line;
                dir = dir ^ (this.player() ^ 1);
                
                attacks = attacks.concat(
                    DraughtsPiece.prototype.allowedAttacks.call(this, field, dir)
                );
            }.bind(this));
            
            for (var i = 0; i < attacks.length; i++) {
                var attack = attacks[i];
                var line = this.element.parentElement.data.line;
                var dir = attack.field.data.line > line;
                dir = dir ^ (this.player() ^ 1);
                
                var fields = this.findNextFields(attack.field, dir);
                fields.forEach(function (field) {
                    if (field.children.length !== 0) {
                        return;
                    }
                    attacks.push({
                        field: field,
                        opponent: attack.opponent
                    })
                });
            }
            
            return attacks;
        };
    }
    
    DraughtsPieceQueenPrototype.prototype = DraughtsPiece.prototype;
    DraughtsPieceQueen.prototype = new DraughtsPieceQueenPrototype();

    // Export to global
    var root = this;
    root.DraughtsBoard = DraughtsBoard;
})();

window.addEventListener('load', function () {
    //TODO: querySelectorAll -> forEach #draughts
    
    var draughts = document.querySelector('#draughts');
    
    var maps = {
        attacks: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 2, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 0],
            [0, 0, 0, 2, 0, 0, 0, 0]
        ],
        twiceAttack: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 0],
            [0, 0, 0, 2, 0, 2, 0, 0]
        ],
        beTheQueen: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        queens: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 4, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 3, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        twiceQueenAttack: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 3, 0, 3, 0, 3, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 3, 0, 3, 0],
            [0, 0, 0, 4, 0, 4, 0, 0]
        ],
        queenRunAttack: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 4, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 3, 0, 4, 0, 0, 0],
            [0, 0, 0, 0, 0, 3, 0, 0]
        ],
        queenStarAttack: [
            [3, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 3, 0, 0, 0],
            [0, 0, 0, 4, 0, 0, 0, 0],
            [0, 0, 0, 0, 3, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 3, 0]
        ]
        
    };
    
    var opt = {
        element: draughts.querySelector('#board'),
        size: 8,
        turn: 0,
        map: false
    };
    
    var board = new DraughtsBoard(opt);
    
    function addEvents() {
        // When gameover display the banner-msg
        board.element.addEventListener('gameover', function (event) {
            var banner = draughts.querySelector('#banner-msg');
            
            var player = banner.querySelector('h2');
            // Using innerHTML because IE8 doesn't have textContent
            player.innerHTML = 'Player' + (event.detail.winner + 1);
            
            banner.style.display = 'block';
        });
        
        board.element.addEventListener('addedpiece', function (event) {
            // Create stash for the dashboard
            
            var piece = event.detail.piece;
            var query = '#dash .player' + piece.player() + ' .captured';
            var stash = draughts.querySelector(query);
            
            if (stash) {
                stash.appendChild(document.createElement('div'));
            }
        });
        
        board.element.addEventListener('pieceattack', function (event) {
            // Move from the board to the dash and prevent default
            
            var piece = event.detail.piece;
            var query = '#dash .player' + piece.data.player() + ' .captured > div';
            var docks = draughts.querySelectorAll(query);
            
            if (docks.length === 0) {
                return;
            }
            
            // I could use some... or make a shim for IE8... but
            for (var i = 0; i < docks.length; i++) {
                if (docks[i].children.length === 0) {
                    docks[i].appendChild(event.detail.opponent);
                    
                    // Default will remove the piece from DOM, so prevent it
                    event.preventDefault && event.preventDefault();
                    event.defaultPrevented = true;
                    return;
                }
            }
            
        });
        
    }
    
    // Disable drag events on the body
    window.addEventListener('dragstart', function (event) {
        event.preventDefault && event.preventDefault();
        return;
    });
    
    function updateBoard() {
        opt.element = draughts.querySelector('#board');
        opt.size = draughts.querySelector('#size').value;
        opt.allowBackwardAttack = draughts.querySelector('#backwardattack').checked;
        board = new DraughtsBoard(opt);
        addEvents();
    }
    addEvents();
    
    (function () {
        draughts.querySelector('#size').addEventListener('change', updateBoard);
    })();
    
});
