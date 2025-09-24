// =================================================================
// 1. INICIALIZAÇÃO DO JOGO E VARIÁVEIS GLOBAIS
// =================================================================
var board = null;
var game = new Chess(); 
var $status = $('#status');
var AI_LEVEL = 3; // Nível de dificuldade: 3 é um bom equilíbrio entre inteligência e velocidade.
var isAITurn = false; // Flag para prevenir movimentos do jogador durante o turno da IA

// Peso das peças para a função de avaliação da IA (em centi-peões)
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

/**
 * Avalia a posição atual do tabuleiro para determinar a vantagem.
 * @returns {number} A pontuação atual (positivo = Brancas melhor, negativo = Pretas melhor).
 */
var evaluateBoard = function (game) {
    var score = 0;
    // Utiliza game.board() que retorna a matriz 8x8 da posição
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

/**
 * Algoritmo NegaMax. Retorna a melhor pontuação possível para o lado que está a mover.
 * @param {number} depth - Profundidade de busca.
 * @returns {number} - A melhor pontuação na profundidade atual.
 */
var negaMax = function (depth, game) {
    // Caso base: Se a profundidade for 0, retorna a avaliação da posição
    if (depth === 0) {
        // Retorna a pontuação NEGADA se for a vez do adversário
        return (game.turn() === 'w') ? -evaluateBoard(game) : evaluateBoard(game);
    }

    var possibleMoves = game.moves({ verbose: true });
    
    // Se não houver movimentos legais (xeque-mate ou empate)
    if (possibleMoves.length === 0) {
        // Se for xeque-mate, a pontuação deve ser muito ruim
        if (game.in_checkmate()) {
            return (game.turn() === 'w') ? -200000 : 200000;
        }
        // Se for empate, a pontuação é 0
        return 0; 
    }

    var maxScore = -Infinity;

    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);

        // Chamada recursiva: o valor é negado, pois inverte a perspectiva
        var score = -negaMax(depth - 1, game);
        
        game.undo(); // Desfaz o movimento

        if (score > maxScore) {
            maxScore = score;
        }
    }
    return maxScore;
};

/**
 * Calcula e executa o melhor movimento para a IA (Pretas).
 */
var calculateBestMove = function () {
    var possibleMoves = game.moves({ verbose: true });
    if (possibleMoves.length === 0) return null;

    var bestMove = null;
    var bestScore = -Infinity;

    // Itera e usa o NegaMax para avaliar cada movimento
    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);
        
        // Chamada do NegaMax. O score é negado. 
        var score = -negaMax(AI_LEVEL - 1, game); 

        game.undo(); // Desfaz o movimento

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
    
    // Usa setTimeout para permitir que a UI se atualize antes de iniciar o cálculo
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

// Chamado quando o jogador solta uma peça
var onDrop = function(source, target) {
    // Tenta fazer o movimento
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Simplifica a promoção para Rainha
    });

    // Se o movimento for ilegal ou se for o turno da IA
    if (move === null || isAITurn) return 'snapback';

    updateStatus();

    // Se o jogo não acabou, é a vez da IA (Pretas)
    if (!game.game_over()) {
        window.setTimeout(makeAIMove, 300); // Pequeno delay
    }
};

// Define quais peças podem ser arrastadas (só as Brancas e se não for turno da IA)
var onDragStart = function (source, piece) {
    // Não permite arrastar se o jogo acabou, se a peça for preta, ou se for turno da IA
    if (game.game_over() || piece.search(/^b/) !== -1 || isAITurn) {
        return false;
    }
};

// Atualiza o texto de status do jogo
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

// Função para iniciar um novo jogo
var resetGame = function() {
    game.reset(); // Reinicia o estado do jogo chess.js
    board.position('start'); // Coloca o tabuleiro na posição inicial
    updateStatus();
    isAITurn = false;
};

// =================================================================
// 4. INICIALIZAÇÃO DO TABULEIRO E EVENTOS
// =================================================================
var cfg = {
    draggable: true,
    position: 'start', // Peças em preto e branco já carregadas
    onDrop: onDrop,
    onDragStart: onDragStart 
};

// Inicializa o tabuleiro e o estado
board = Chessboard('board', cfg);
updateStatus(); 
$('#reset-button').on('click', resetGame);