var board = null;
// Inicializa o objeto do jogo chess.js
var game = new Chess(); 
var $status = $('#status');

// --- Lógica da IA (simplificada, apenas um movimento aleatório) ---
var makeAIMove = function() {
    // Pega todos os movimentos legais
    var possibleMoves = game.moves();

    // Se não houver movimentos, o jogo acabou
    if (possibleMoves.length === 0) return;

    // Escolhe um movimento aleatório (NÍVEL MUITO FÁCIL!)
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    var move = possibleMoves[randomIdx];

    // Faz o movimento
    game.move(move);
    board.position(game.fen());
    updateStatus();
};
// -----------------------------------------------------------------

// Lógica de Movimento do Jogador
var onDrop = function(source, target) {
    // Tenta fazer o movimento
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Simplifica a promoção para Rainha
    });

    // Movimento ilegal
    if (move === null) return 'snapback';

    updateStatus();

    // Movimento legal feito. Agora é a vez da IA (com pequeno delay)
    window.setTimeout(makeAIMove, 250);
};

// Atualiza o texto de status do jogo
var updateStatus = function() {
    var status = '';
    var moveColor = 'Brancas';
    if (game.turn() === 'b') {
        moveColor = 'Pretas';
    }

    if (game.in_checkmate()) {
        status = 'Jogo encerrado, ' + moveColor + ' está em **Xeque-Mate**!';
    } else if (game.in_draw()) {
        status = 'Jogo encerrado por **Empate**!';
    } else {
        status = 'É a vez de **' + moveColor + '**';
        if (game.in_check()) {
            status += ' (em Xeque)';
        }
    }

    $status.html(status);
};


// Configurações do Tabuleiro
var cfg = {
    draggable: true,
    position: 'start', // Posição inicial do xadrez
    onDrop: onDrop, // Chama a função onDrop quando uma peça é solta
    // Apenas permitir que o jogador (Brancas) arraste as peças
    onDragStart: function (source, piece) {
        // Não permitir arrastar se o jogo acabou ou não é a vez da Branca
        if (game.game_over() || (game.turn() === 'b')) {
            return false;
        }
    }
};

// Inicializa o tabuleiro
board = Chessboard('board', cfg);
updateStatus(); // Atualiza o status inicial
// =================================================================
// 1. INICIALIZAÇÃO DO JOGO E VARIÁVEIS GLOBAIS
// =================================================================
var board = null;
var game = new Chess(); 
var $status = $('#status');
var AI_LEVEL = 3; // Profundidade máxima de busca para a IA (nível de dificuldade)

// Peso das peças para a função de avaliação da IA (em centi-peões)
var PIECE_VALUES = {
    'p': 100, // Peão
    'n': 320, // Cavalo
    'b': 330, // Bispo
    'r': 500, // Torre
    'q': 900, // Rainha
    'k': 20000 // Rei (alto valor para evitar perdas)
};

// =================================================================
// 2. LÓGICA DA INTELIGÊNCIA ARTIFICIAL (IA) - ALGORITMO NEGAMAX SIMPLIFICADO
// =================================================================

/**
 * Avalia a posição atual do tabuleiro para determinar a vantagem.
 * @returns {number} A pontuação atual do tabuleiro.
 */
var evaluateBoard = function (game) {
    var score = 0;
    game.board().forEach(function (row) {
        row.forEach(function (piece) {
            if (piece) {
                var value = PIECE_VALUES[piece.type];
                // Posições favoráveis para as brancas (negativas para as pretas)
                if (piece.color === 'w') {
                    score += value;
                } 
                // Posições favoráveis para as pretas (positivas para as brancas, 
                // mas a IA inverte o sinal no NegaMax)
                else {
                    score -= value;
                }
            }
        });
    });
    return score;
};

/**
 * Algoritmo NegaMax (busca o melhor movimento com base na avaliação).
 * Esta é a função principal da IA.
 * @param {number} depth A profundidade de busca.
 * @param {object} game O objeto do jogo chess.js.
 * @returns {number} A melhor pontuação encontrada.
 */
var negaMax = function (depth, game) {
    // Caso base: Se a profundidade for 0, retorna a avaliação da posição
    if (depth === 0) {
        // Multiplica por -1 se for a vez do adversário (brancas), 
        // pois o NegaMax inverte a perspectiva em cada camada
        return (game.turn() === 'w') ? -evaluateBoard(game) : evaluateBoard(game);
    }

    var possibleMoves = game.moves({ verbose: true });
    var maxScore = -Infinity;

    if (possibleMoves.length === 0) {
        return evaluateBoard(game);
    }

    // Loop por todos os movimentos possíveis
    for (var i = 0; i < possibleMoves.length; i++) {
        var move = possibleMoves[i];
        game.move(move);

        // Chamada recursiva para o próximo nível de profundidade
        // O valor é negado, pois o que é bom para um é ruim para o outro.
        var score = -negaMax(depth - 1, game);
        
        game.undo(); // Desfaz o movimento (muito importante!)

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
        
        // Chamada do NegaMax. A pontuação é negada, pois a IA (Pretas) 
        // quer o menor número de NegaMax (o maior para as Pretas)
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
    var move = calculateBestMove();

    if (move) {
        game.move(move);
        board.position(game.fen());
        updateStatus();
    }
};

// Chamado quando o jogador solta uma peça
var onDrop = function(source, target) {
    // Tenta fazer o movimento (simplifica a promoção para Rainha)
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' 
    });

    // Se o movimento for ilegal
    if (move === null) return 'snapback';

    updateStatus();

    // Se o jogo não acabou, é a vez da IA (com um pequeno delay para a UX)
    if (!game.game_over()) {
        window.setTimeout(makeAIMove, 300);
    }
};

// Define quais peças podem ser arrastadas (só as Brancas no início)
var onDragStart = function (source, piece) {
    // Não permite arrastar se o jogo acabou ou não for a vez das Brancas
    if (game.game_over() || piece.search(/^b/) !== -1) {
        return false;
    }
};


// Atualiza o texto de status do jogo
var updateStatus = function() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'Brancas' : 'Pretas';

    if (game.in_checkmate()) {
        status = 'Jogo encerrado. **' + moveColor + '** está em **Xeque-Mate**!';
    } else if (game.in_draw()) {
        status = 'Jogo encerrado por **Empate**!';
    } else {
        status = 'É a vez de **' + moveColor + '**';
        if (game.in_check()) {
            status += ' (em Xeque)';
        }
    }
    $status.html(status);
};


// =================================================================
// 4. INICIALIZAÇÃO DO TABULEIRO
// =================================================================
var cfg = {
    draggable: true,
    position: 'start', // Carrega as peças pretas e brancas na posição inicial
    onDrop: onDrop,
    onDragStart: onDragStart 
};

board = Chessboard('board', cfg);
updateStatus(); // Atualiza o status inicial