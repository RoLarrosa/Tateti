

let tablero = new Array();
let tableroNormalizado = Array();
const huPlayer = 'O';
const aiPlayer = 'X';

const combosGanadores = [

	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[6, 4, 2]

];

const cells = document.querySelectorAll('.cell');

//Inicia el juego:
startGame();

function startGame() {

	//Aquí me aseguro que el div del endgame no se muestre.
	document.querySelector(".endgame").style.display = "none";

	//Inicializo el tablero con un array de 9 posiciones en las cuales no habrá ningún valor

	for ( let i = 0; i < cells.length; i++ ) {
		cells[i].innerText = ''; // Limpio el contenido de la celda

		//Le quito el fondo que va a tener cuando alguien gane el juego
		cells[i].style.removeProperty('background-color'); 

		//Sobre cada celda, escucho el evento clic y si se produce, ejecuto la fucnión turnClick que me convertirá este clic en un círculo dibujado en la celda donde se hizo el clic.
		cells[i].addEventListener('click', turnClick, false);
	}
	tablero = [2, 3, 4, 5, 6, 7, 8, 9, 10];
	tableroNormalizado = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	console.log("Tablero después del for del startGame: ", tablero)
}


/**
 * Esta función recibe el 'cuadrado' (el evento). Y luego ejecuta la función turn.
 * @param {} square 
 */
async function turnClick( square) {
	console.log("El 'square.target.id' es: ", square.target.id )
	console.log('Tablero dentro del turnClick ANTES de entrar al "if ( typeof tablero[square.target.id] === "number" )" : ', tablero)
	if ( typeof tablero[square.target.id] === "number" ) {
		
		console.log('Tablero dentro del turnClick ANTES de ejecutar turn : ', tablero)
		turn(square.target.id, huPlayer, tablero);
		console.log('Tablero dentro del turnClick DESPUÉS de ejecutar turn : ', tablero)

		
		if( !checkWin(tablero, huPlayer) && !checkTie()) {
			console.log('pasó el tie y el check para verificar si ganó el humano')
			
			console.log('Tablero normalizado dentro del turnClick ANTES de normalizar: ', tableroNormalizado);
			tableroNormalizado = normalizarTablero(tablero);
			console.log('Tablero normalizado dentro del turnClick DESPUÉS de normalizar: ', tableroNormalizado);

			let spotIA = await predecir(tableroNormalizado);
			
			turn(spotIA, aiPlayer, tablero);
		}
	}
}


/**
 * Esta función turn puede ser llamada tanto por el jugador humano, como por la IA. Y lo que hace es modificar el tablero que recibe por parámetro, ubicando en la posición que eligió el jugador, una 'X' (en caso de que el jugador sea la IA) o una 'O' (en caso de que el jugador sea el humano)
 * @param {number} squareId 
 * @param {string} player 
 */
function turn(squareId, player, board) {
	console.log("El tablero dentro del turn", board);
	console.log("El id que recibe el turn: ", squareId);
	board[squareId] = player;
	document.getElementById(squareId).innerText = player;
	let gameWon = checkWin( board, player);
	if (gameWon) gameOver(gameWon);
	tableroNormalizado = normalizarTablero(board);
	console.log("El tablero dentro del turn AL FINAL: ", board);
	console.log("El id que recibe el turn AL FINAL: ", squareId);
	console.log('El gameWon dentro del turn al final: ', gameWon);

}

/**
 * 
 * @param {array} tablero 
 * @param {*} player 
 */
function checkWin( board, player ) {
	let plays = board.reduce((acum, element, index) => 
		(element === player) ? acum.concat(index) : acum , []);

	let gameWon = null;
	for (let [index, win] of combosGanadores.entries()) {
		let gano = win.every( elem => plays.indexOf(elem) > -1 )
		if(gano){
			gameWon = {index: index, player: player}
			break;
		}
	}
	return gameWon;
}


function gameOver(gameWon) {
	for (let index of combosGanadores[gameWon.index]) {
		document.getElementById(index).style.backgroundColor = (gameWon.player === huPlayer) ? 'blue' : 'red'
	}

	for (let index = 0; index < cells.length; index++) {
		cells[index].removeEventListener('click', turnClick, false)
	}

	declareWinner( ( gameWon.player === huPlayer ) ? "Ganaste!" : "La IA ganó." );
}

async function declareWinner( who ) {
	document.querySelector(".endgame").style.display = "block";
	const quien = await who;
	document.querySelector(".endgame .text").innerText = quien;
}

function emptySquares() {
	console.log("Tablero dentro del emptySquares(): ", tablero)
	return tablero.filter( square => typeof square === 'number' )
}




function checkTie() {
	if (emptySquares().length === 0) {
		for (let index = 0; index < cells.length; index++) {
			cells[index].style.backgroundColor = 'green';
			cells[index].removeEventListener('click', turnClick, false);
		}
		declareWinner('Empate!');
		return true;			
	}
	return false;
}

/**
 *  Esta función recibe un array (que representa el estado actual del tablero) y me retorna un entero 
 *  indicando la posición del array donde la IA quiere jugar.
 *  Para hacer esto la función se vale de una segunda función "bestSpot()".
 *  
 */
async function predecir (array){
    const modelPath = './web/model/ttt_model.json';
    try {
        await tf.ready();
    } catch (error) {
        console.log("Hubo un error al cargar el modelo")
    }
    const entradaParcial = tf.tensor(array);

    const model = await tf.loadLayersModel(modelPath);

    // Stack states into a shape [3, 9]
    const matches = tf.stack([
        entradaParcial
    ]);

    const result = model.predict(matches);

    // Log the results
	console.log('Este es el tensor que me genera la función predecir(): ')
    result.print();
    const resultArray = await result.array();
    console.log("Este es el resultArray de la predecir: ", resultArray);
	const resultArrayAplanadoDesordenado = [ ...resultArray[0]]
	const resultArrayAplanado = [ ...resultArray[0]]
	resultArrayAplanado.sort((a, b) => b - a);

	let mejorIndice = bestSpot(resultArrayAplanadoDesordenado)

    return mejorIndice;

}

const bestSpot = (array) => {
	let max = -1;
	let index_max;
	for (let elemento of array) {

		if (elemento > 0 && elemento > max) {
            max = elemento;
            index_max = array.indexOf(elemento)
		}
        
	}

	return index_max;
}

/**
 * Esta función recibe un array de 'O', 'X' y 0 y me retorna un array de números, donde había una 'O' coloca
 * un -1, donde había una 'X' coloca un 1.
 * @param {[number string]} array 
 * @returns {[number]} array
 */
const normalizarTablero = (array) => {
	const newArray = array.map((elemento, index) => {
		if (elemento === 'O' || elemento === -1) {
			return -1;
		} else if(elemento === 'X' || elemento === 1) {
			return 1;
		} else {
			return 0;
		}

	});
	return newArray;
}

