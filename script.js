// =================================================================
// 1. INICIALIZAÇÃO DO JOGO E VARIÁVEIS GLOBAIS
// =================================================================
var board = null;
var game = new Chess(); 
var $status = $('#status');
var AI_LEVEL = 3; // Nível de dificuldade da máquina (IA)
var isAITurn = false; // Bloqueia o jogador durante o cálculo da IA

// Peso das peças para a função de avaliação da IA
var PIECE_VALUES = {
    'p': 100, 
    'n': 320, 
    'b': 330, 
    'r': 500, 
    'q': 900, 
    'k': 20000 
};

// =================================================================
// 2. LÓGICA DA INTELIGÊNCIA ARTIFICIAL (IA) - ALGORITMO NEGAMAX
// =================================================================

var evaluateBoard = function (game) {
    var score = 0;
    game.board().forEach(function (row) {
        row.forEach(function (piece) {
            if (piece) {
                var value = PIECE_VALUES[piece.type];
                // Se a peça for branca, adiciona valor; se for preta, subtrai
                score += (piece.color === 'w') ? value : -value;
            }
        });
    });
    return score;
};

var negaMax = function (depth, game) {
    if (depth === 0) {
        // Retorna a pontuação NEGADA se for a vez do adversário
        return (game.turn() === 'w') ? -evaluateBoard(game) : evaluateBoard(game);
    }

    var possibleMoves = game.moves({ verbose: true });
    
    if (possibleMoves.length === 0) {
        // Pontuação de xeque-mate ou empate
        if (game.in_checkmate()) return (game.turn() === 'w') ? -200000 : 200000;
        return 0; 
    }

    var maxScore = -Infinity;

    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);

        var score = -negaMax(depth - 1, game); 
        
        game.undo(); // Desfaz o movimento (fundamental!)

        if (score > maxScore) {
            maxScore = score;
        }
    }
    return maxScore;
};

var calculateBestMove = function () {
    var possibleMoves = game.moves({ verbose: true });
    if (possibleMoves.length === 0) return null;

    var bestMove = null;
    var bestScore = -Infinity;

    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);
        
        // Chamada do NegaMax. O score é negado. 
        var score = -negaMax(AI_LEVEL - 1, game); 

        game.undo(); 

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
};

// =================================================================
// 3. FUNÇÕES DE CONTROLE DO JOGO E INTERFACE
// =================================================================

var makeAIMove = function() {
    isAITurn = true;
    $status.html('É a vez de **Pretas** (Máquina pensando...)');
    
    // Pequeno delay para a UI atualizar e evitar travamento
    window.setTimeout(function() {
        var move = calculateBestMove();

        if (move) {
            game.move(move);
            board.position(game.fen());
        }
        isAITurn = false;
        updateStatus();
    }, 100); 
};

// Movimento do Jogador (Brancas)
var onDrop = function(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' 
    });

    // Se o movimento for ilegal ou for turno da IA, volta a peça
    if (move === null || isAITurn) return 'snapback';

    updateStatus();

    // Se o jogo não acabou, chama a IA
    if (!game.game_over()) {
        window.setTimeout(makeAIMove, 300); 
    }
};

// Restringe o arrastar de peças (só Brancas e só no turno do jogador)
var onDragStart = function (source, piece) {
    if (game.game_over() || piece.search(/^b/) !== -1 || isAITurn) {
        return false;
    }
};

var updateStatus = function() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'Brancas' : 'Pretas';
    var $resetButton = $('#reset-button');

    if (game.in_checkmate()) {
        status = 'Jogo encerrado. **' + moveColor + '** está em **Xeque-Mate**!';
        $resetButton.show();
    } else if (game.in_draw()) {
        status = 'Jogo encerrado por **Empate**!';
        $resetButton.show();
    } else {
        status = 'É a vez de **' + moveColor + '**';
        if (game.in_check()) {
            status += ' (em Xeque)';
        }
        $resetButton.hide();
    }
    $status.html(status);
};

var resetGame = function() {
    game.reset(); 
    board.position('start'); 
    updateStatus();
    isAITurn = false;
};

// =================================================================
// 4. INICIALIZAÇÃO DO TABULEIRO E EVENTOS
// =================================================================
var cfg = {
    draggable: true,
    position: 'start', 
    onDrop: onDrop,
    onDragStart: onDragStart 
};

board = Chessboard('board', cfg);
updateStatus(); 
$('#reset-button').on('click', resetGame);