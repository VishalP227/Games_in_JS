let originalBoard;
const human = 'O';
const computer = 'X';
const winCombs = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const cells = document.querySelectorAll(".cell");

startGame();

function startGame(){
    document.querySelector(".endgame").style.display = "none";
    originalBoard = Array.from(Array(9).keys());
    for(let i = 0; i < cells.length; i++){
        cells[i].innerText = "";
        cells[i].style.removeProperty("background-color");
        cells[i].addEventListener('click', turnClick, false);
    }
}

function turnClick(square){
    if(typeof originalBoard[square.target.id] == 'number'){
        turn(square.target.id, human);
        if(!checkTie()) turn(bestSpot(), computer);
    } 
}

function turn(squareId, player){
    originalBoard[squareId] = player;
    document.getElementById(squareId).innerText = player;
    let gameWon = checkWin(originalBoard, player);
    if (gameWon) gameOver(gameWon);
}

function checkWin(board, player){
    let gameWon = null;

    let plays = board.reduce((a, e, i) => 
    (e === player) ? a.concat(i) : a, []);

    for (let [index, win] of winCombs.entries()){
        if (win.every(elem => plays.indexOf(elem) > -1)){
            gameWon = {index: index, player: player};
            break;
        }
    }
    return gameWon;
}

function gameOver(gameWon){
    for (let index of winCombs[gameWon.index]){
        document.getElementById(index).style.backgroundColor = (gameWon.player == human ? "green" : "red");
    }

    for(let i = 0; i < cells.length; i++){
        cells[i].removeEventListener('click', turnClick, false);
    }

    declareWinner(gameWon.player == human ? "You win!" : "You lose...");
}

function declareWinner(who){
    document.querySelector(".endgame").style.display = "block";
    document.querySelector(".endgame .text").innerText = who;
}

function emptySquares(){
    return originalBoard.filter(s => typeof s == 'number');
}

function bestSpot(){
    return minimax(originalBoard, computer).index;
}

function checkTie(){
    if(emptySquares().length == 0){
        for(let i = 0; i < cells.length; i++){
            cells[i].style.backgroundColor = "blue";
            cells[i].removeEventListener('click', turnClick, false);
        }
        declareWinner("Tie game!");
        return true;
    }
    return false;
}

function minimax(newBoard, player){
    let availSpots = emptySquares(newBoard);

    if(checkWin(newBoard, human)){
        return {score: -10};
    } else if (checkWin(newBoard, computer)){
        return {score: 10};
    } else if (availSpots.length == 0){
        return {score: 0};
    }

    let moves = [];

    for(let i = 0; i < availSpots.length; i++){
        let move = {};
        move.index = newBoard[availSpots[i]];
        newBoard[availSpots[i]] = player;

        if (player == computer){
            let result = minimax(newBoard, human);
            move.score = result.score;
        } else {
            let result = minimax(newBoard, computer);
            move.score = result.score;
        }

        newBoard[availSpots[i]] = move.index;
        moves.push(move);
    }

    let bestMove;
    if(player === computer){
        let bestScore = -1000;
        for(let i = 0; i < moves.length; i++){
            if(moves[i].score > bestScore){
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 1000;
        for(let i = 0; i < moves.length; i++){
            if(moves[i].score < bestScore){
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}