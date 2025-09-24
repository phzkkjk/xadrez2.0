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