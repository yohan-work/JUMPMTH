import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [characters, setCharacters] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [winner, setWinner] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')
  const [gameTime, setGameTime] = useState(0)
  const gameFieldRef = useRef(null)
  const obstacleIntervalRef = useRef(null)
  const gameTimerRef = useRef(null)

  const startGame = () => {
    if (gameStarted) return
    
    const names = nameInput.split(',')
      .map(name => name.trim())
      .filter(n => n)
    
    if (names.length === 0) return

    setGameStarted(true)
    setWinner(null)
    setGameTime(0)
    setCharacters(names.map((name, idx) => ({
      name,
      position: { x: 50 + idx * 50, y: 0 },
      isJumping: false,
      color: getRandomColor(),
      id: Date.now() + idx,
      dead: false,
      score: 0
    })))
    
    startObstacleFall()
    startGameTimer()
  }

  const startGameTimer = () => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current)
    }
    
    gameTimerRef.current = setInterval(() => {
      setGameTime(prevTime => prevTime + 1)
      
      setCharacters(prevChars => 
        prevChars.map(char => 
          !char.dead ? { ...char, score: char.score + 1 } : char
        )
      )
    }, 1000)
  }

  const getRandomColor = () => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const startAutoJump = (character) => {
    const jump = () => {
      if (character.isJumping) return
      
      setCharacters(prevChars => 
        prevChars.map(char => 
          char.id === character.id 
            ? { ...char, isJumping: true, position: { ...char.position, y: 80 } }
            : char
        )
      )

      setTimeout(() => {
        setCharacters(prevChars => 
          prevChars.map(char => 
            char.id === character.id 
              ? { ...char, position: { ...char.position, y: 0 } }
              : char
          )
        )
      }, 300)

      setTimeout(() => {
        setCharacters(prevChars => 
          prevChars.map(char => 
            char.id === character.id 
              ? { ...char, isJumping: false }
              : char
          )
        )
      }, 600)

      let minTime = 1000;
      let maxTime = 2500;
      
      if (difficulty === 'easy') {
        minTime = 1500;
        maxTime = 3000;
      } else if (difficulty === 'hard') {
        minTime = 500;
        maxTime = 1500;
      }
      
      const nextJumpTime = minTime + Math.random() * (maxTime - minTime)
      setTimeout(() => {
        const currentChar = characters.find(c => c.id === character.id)
        if (currentChar && !currentChar.dead) {
          jump()
        }
      }, nextJumpTime)
    }

    jump()
  }

  const startObstacleFall = () => {
    if (obstacleIntervalRef.current) {
      clearInterval(obstacleIntervalRef.current)
    }
    
    let obstacleInterval = 1500;
    let obstacleDuration = 3;
    
    if (difficulty === 'easy') {
      obstacleInterval = 2000;
      obstacleDuration = 4;
    } else if (difficulty === 'hard') {
      obstacleInterval = 1000;
      obstacleDuration = 2;
    }
    
    obstacleIntervalRef.current = setInterval(() => {
      if (!gameFieldRef.current) return
      
      const obstacle = document.createElement('div')
      obstacle.className = 'obstacle'
      obstacle.style.animationDuration = `${obstacleDuration}s`
      gameFieldRef.current.appendChild(obstacle)
      
      const checkInterval = setInterval(() => {
        if (!gameFieldRef.current) {
          clearInterval(checkInterval)
          return
        }
        
        const obsBottom = parseInt(window.getComputedStyle(obstacle).bottom)
        
        setCharacters(prevChars => {
          let updated = [...prevChars]
          let eliminations = false
          
          updated = updated.map(ch => {
            if (ch.dead || ch.isJumping) return ch
            
            if (ch.position.y < 20 && obsBottom < 20 && !ch.dead) {
              eliminations = true
              return { ...ch, dead: true }
            }
            
            return ch
          }).filter(ch => !ch.dead)
          
          if (updated.length === 1 && eliminations) {
            setWinner(updated[0])
            
            if (gameTimerRef.current) {
              clearInterval(gameTimerRef.current)
              gameTimerRef.current = null
            }
          }
          
          return updated
        })
        
        if (obsBottom <= 0) {
          clearInterval(checkInterval)
          obstacle.remove()
        }
      }, 100)
    }, obstacleInterval)
  }

  const resetGame = () => {
    setGameStarted(false)
    setWinner(null)
    setCharacters([])
    setGameTime(0)
    if (obstacleIntervalRef.current) {
      clearInterval(obstacleIntervalRef.current)
      obstacleIntervalRef.current = null
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current)
      gameTimerRef.current = null
    }
  }

  const shareResults = async () => {
    const url = window.location.href
    const shareText = `Jump MATCH 게임에서 ${winner.name}님이 승리했습니다! 생존 시간: ${gameTime}초, 점수: ${winner.score}점`
    
    try {
      await navigator.clipboard.writeText(`${shareText} - ${url}`)
      alert('결과가 복사되었습니다! 친구에게 붙여넣어 보내보세요.')
    } catch {
      alert('복사 실패. 직접 주소창에서 복사해주세요.')
    }
  }

  useEffect(() => {
    characters.forEach(char => {
      if (!char.dead && !char.jumpInitialized) {
        char.jumpInitialized = true
        startAutoJump(char)
      }
    })
  }, [characters])

  useEffect(() => {
    return () => {
      if (obstacleIntervalRef.current) {
        clearInterval(obstacleIntervalRef.current)
      }
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="game-container">
      <h1>Jump MATCH</h1>
      
      {!gameStarted ? (
        <div className="setup">
          <textarea 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="이름을 쉼표로 구분해서 입력하세요 (예: 김길동,이길동,박길동)"
          />
          
          <div className="difficulty-selector">
            <p>난이도 선택:</p>
            <div className="difficulty-buttons">
              <button 
                className={difficulty === 'easy' ? 'active' : ''} 
                onClick={() => setDifficulty('easy')}
              >
                쉬움
              </button>
              <button 
                className={difficulty === 'normal' ? 'active' : ''} 
                onClick={() => setDifficulty('normal')}
              >
                보통
              </button>
              <button 
                className={difficulty === 'hard' ? 'active' : ''} 
                onClick={() => setDifficulty('hard')}
              >
                어려움
              </button>
            </div>
          </div>
          
          <button className="start-button" onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
          <div className="game-stats">
            <span>경과 시간: {gameTime}초</span>
            <span>남은 플레이어: {characters.length}명</span>
          </div>
          
          <div id="gameField" ref={gameFieldRef} className="game-field">
            {characters.map(char => (
              <div 
                key={char.id}
                className="character"
                data-name={char.name}
                data-score={char.score}
                style={{
                  left: `${char.position.x}px`,
                  bottom: `${char.position.y}px`,
                  backgroundColor: char.color,
                  transition: char.isJumping ? 'bottom 0.3s ease' : ''
                }}
              />
            ))}
          </div>
          
          {winner && (
            <div id="resultBox" className="result-box">
              <h2>🏆 우승자: {winner.name} 🎉</h2>
              <p>생존 시간: {gameTime}초</p>
              <p>최종 점수: {winner.score}점</p>
              <div className="buttons">
                <button onClick={resetGame}>다시하기</button>
                <button onClick={shareResults}>📤 결과 공유하기</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
