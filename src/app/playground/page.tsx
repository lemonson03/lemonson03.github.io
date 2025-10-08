'use client';
import React, { useEffect, useRef, useState } from "react";

const margin = 30;
const ROW = 18 // 바둑판 선 개수
const STONE_RADIUS = 19; // 바둑돌 크기
const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const;
const CELL_SIZE = 800 + margin * 2; // 바둑판 한 칸 크기
const INITIAL_TIME = 180; // 3 minutes in seconds

type PlayerKey = 'P1' | 'P2';
type ColorKey = typeof COLORS[number];

const colorClass: Record<ColorKey, { base: string; hover: string }> = {
  red: { base: 'bg-red-600', hover: 'hover:bg-red-700' },
  orange: { base: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  yellow: { base: 'bg-yellow-400', hover: 'hover:bg-yellow-500' },
  green: { base: 'bg-green-600', hover: 'hover:bg-green-700' },
  blue: { base: 'bg-blue-600', hover: 'hover:bg-blue-700' },
  purple: { base: 'bg-purple-500', hover: 'hover:bg-purple-600' },
  pink: { base: 'bg-pink-400', hover: 'hover:bg-pink-500' },
};
const PlayGround: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<{ ply: number; color: string }[][]>(
    Array.from({ length: ROW }, () => Array(ROW).fill({ ply: 0, color: '' }))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [moves, setMoves] = useState<{ x: number; y: number }[]>([]);
  const [selectedColors, setSelectedColors] = useState<Record<PlayerKey, ColorKey>>({ P1: 'red', P2: 'red' });
  const [winner, setWinner] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<{ x: number; y: number } | null>(null);
  const [timers, setTimers] = useState<Record<PlayerKey, number>>({ P1: INITIAL_TIME, P2: INITIAL_TIME });
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || winner !== null) return;
    const interval = setInterval(() => {
      setTimers(prev => {
        const currentPlayer: PlayerKey = isBlackTurn ? 'P1' : 'P2';
        const newTime = Math.max(prev[currentPlayer] - 1, 0);
        return { ...prev, [currentPlayer]: newTime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlackTurn, winner, gameStarted]);


  useEffect(() => {
    if (!gameStarted || winner !== null) return;

    const interval = setInterval(() => {
      setTimers(prev => {
        const currentPlayer = isBlackTurn ? 'P1' : 'P2';
        const newTime = Math.max(prev[currentPlayer] - 1, 0);
        return { ...prev, [currentPlayer]: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlackTurn, winner, gameStarted]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawBoard(ctx);
        drawStones(ctx);
        if (pendingMove) {
          drawRect(ctx, pendingMove.x, pendingMove.y);
        }
      }
    }
  }, [board, pendingMove, winner]);

  const drawBoard = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "#d3e3fd";
    ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = "#041e49";

    const rowSize = 800 / ROW;
    const dolSize = 10;

    for (let x = 0; x < ROW; x++) {
      for (let y = 0; y < ROW; y++) {
        ctx.strokeRect(rowSize * x + margin, rowSize * y + margin, rowSize, rowSize);
      }
    }

    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = '#041e49';
        ctx.beginPath();
        ctx.arc(
          (3 + a * 6) * rowSize + margin,
          (3 + b * 6) * rowSize + margin,
          dolSize / 3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  };

  const drawStones = (ctx: CanvasRenderingContext2D) => {
    const cellSize = 800 / ROW;
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.ply !== 0) {
          ctx.beginPath();
          ctx.arc(
            x * cellSize + margin,
            y * cellSize + margin,
            STONE_RADIUS,
            0,
            Math.PI * 2
          );
          const stoneColor =
            winner !== null
              ? (cell.ply === 1 ? 'black' : 'white')
              : cell.color;
          ctx.fillStyle = stoneColor;
          ctx.fill();
        }
      });
    });
  };

  const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const w = 800 / ROW;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x * w + margin - w / 2,
      y * w + margin - w / 2,
      w,
      w
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (winner !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - margin + (800 / ROW) / 2) / (800 / ROW));
    const y = Math.floor((event.clientY - rect.top - margin + (800 / ROW) / 2) / (800 / ROW));

    if (x >= 0 && x < ROW && y >= 0 && y < ROW && board[y][x].ply === 0) {
      setPendingMove({ x, y });
    }
  };

  const changeColorAndSize = ({ color, num }: { color: string; num: number }) => {
    setSelectedColors(prevColors => ({
      ...prevColors,
      [num === 1 ? 'P2' : 'P1']: color
    }));
  }

  const undoMove = () => {
    if (moves.length > 0) {
      const lastMove = moves[moves.length - 1];
      const newBoard = board.map(row => [...row]);
      newBoard[lastMove.y][lastMove.x] = { ply: 0, color: '' };
      setBoard(newBoard);
      setMoves(moves.slice(0, -1));
      setIsBlackTurn(!isBlackTurn);
    }
  };

  const placeStone = () => {
    if (!pendingMove) return;
    if (!gameStarted) setGameStarted(true);

    const { x, y } = pendingMove;

    if (board[y][x].ply !== 0) {
      setPendingMove(null);
      return;
    }

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const currentPlayer = isBlackTurn ? 1 : 2;
    const colorKey: PlayerKey = currentPlayer === 1 ? 'P1' : 'P2';
    newBoard[y][x] = { ply: currentPlayer, color: selectedColors[colorKey] };
    setBoard(newBoard);
    setMoves(prev => [...prev, { x, y }]);

    if (checkWin(newBoard, x, y, currentPlayer)) {
      setWinner(currentPlayer);
    } else {
      setIsBlackTurn(prev => !prev);
    }
    setPendingMove(null);
  };

  const checkWin = (board: { ply: number; color: string }[][], x: number, y: number, player: number): boolean => {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 }
    ];

    return directions.some(({ dx, dy }) => {
      let count = 1;

      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx >= 0 && nx < ROW && ny >= 0 && ny < ROW && board[ny][nx].ply === player) {
          count++;
        } else {
          break;
        }
      }

      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i, ny = y - dy * i;
        if (nx >= 0 && nx < ROW && ny >= 0 && ny < ROW && board[ny][nx].ply === player) {
          count++;
        } else {
          break;
        }
      }

      return count >= 5;
    });
  };

  useEffect(() => {
    if (moves.length > 0) {
      const lastMove = moves[moves.length - 1];
      const player = isBlackTurn ? 2 : 1;
      if (checkWin(board, lastMove.x, lastMove.y, player)) {
        setWinner(player);
      }
    }
  }, [moves]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafd]">
      <section className="flex flex-col text-center text-[40px]">
        <div className="font-bold">Blind Five mok</div>

        {/* Control Buttons */}
        <div className="w-[200px] h-[50px] self-center grid grid-cols-2 gap-1 mt-4">
          <button
            onClick={undoMove}
            className="w-[90px] h-[60px] text-[18px] font-bold bg-[aliceblue] border border-[LightSteelBlue] rounded-[10px] hover:bg-[lightblue] hover:border-[deepskyblue] transition-colors"
          >
            무르기
          </button>
          <button
            className="w-[90px] h-[60px] text-[18px] font-bold bg-gray-400 border border-gray-500 rounded-[10px]"
            onClick={() => window.location.reload()}
          >
            다시하기
          </button>
        </div>
      </section>

      {/* Play Area */}
      <section className="relative flex justify-between pt-8">
        {/* Win Overlay */}
        {winner && (
          <div
            className={[
              "w-[630px] h-[570px] fixed z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "text-center pt-[50px] inline-block align-middle text-[70px] font-extrabold",
              "animate-blink",
              winner === 1 ? "bg-black text-white" : "bg-white text-black"
            ].join(' ')}
          >
            {`Player${winner} 승리!`}
            <div className="w-[600px] h-[600px] mx-auto mt-4">
              <img className="mx-auto w-[200px] h-[200px]" src="./trophy.png" alt="" />
            </div>
          </div>
        )}

        {/* Canvas Centered */}
        <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[calc(-50%+40px)] z-10">
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            width={CELL_SIZE}
            height={CELL_SIZE}
          />
        </div>

        {/* Players */}
        {(['P1', 'P2'] as const).map((player, index) => {
          const isCurrentTurn = isBlackTurn ? index === 0 : index === 1;
          const rotateContainer = index === 1 ? 'rotate-180 p-2' : '';
          return (
            <div key={player} className={`w-full flex items-center ${rotateContainer}`}>
              <div className="flex flex-col items-center gap-[10px]">
                {/* Color buttons */}
                <div className="flex flex-col items-center">
                  {COLORS.map(color => {
                    const selected = selectedColors[player] === color;
                    return (
                      <button
                        key={color}
                        className={[
                          "w-[47px] h-[47px] rounded-full m-1.5 border-0 cursor-pointer transition",
                          colorClass[color].base,
                          isCurrentTurn ? colorClass[color].hover : "opacity-60",
                          selected ? "scale-110 shadow-[0_0_20px_white] ring-2 ring-white" : ""
                        ].join(' ')}
                        onClick={() => isCurrentTurn && changeColorAndSize({ color, num: index })}
                        style={{ visibility: isCurrentTurn ? 'visible' : 'hidden' }}
                        aria-label={`color-${color}`}
                      />
                    );
                  })}
                </div>

                {/* Place stone */}
                <button
                  className={[
                    "border-0 w-[100px] h-[70px] my-[30px] rounded-[12px] rotate-90",
                    "bg-[#d3e3fd] text-[#1f1f1f] text-[20px] font-bold",
                    "inline-block cursor-pointer",
                    "hover:bg-[#EAF0FD]",
                    isCurrentTurn ? "" : "invisible"
                  ].join(' ')}
                  onClick={() => isCurrentTurn && placeStone()}
                >
                  착수
                </button>

                {/* Timer */}
                <div className="w-10 h-10 text-[25px] rotate-90 text-center">
                  {formatTime(timers[player])}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  )
}

export default PlayGround;
