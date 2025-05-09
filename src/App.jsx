import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [characters, setCharacters] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [winner, setWinner] = useState(null)
  const gameFieldRef = useRef(null)
  const obstacleIntervalRef = useRef(null)

  const startGame = () => {
    if (gameStarted) return
    
    const names = nameInput.split(',')
      .map(name => name.trim())
      .filter(n => n)
    
    if (names.length === 0) return

    setGameStarted(true)
    setWinner(null)
    setCharacters(names.map((name, idx) => ({
      name,
      position: { x: 50 + idx * 50, y: 0 },
      isJumping: false,
      color: getRandomColor(),
      id: Date.now() + idx,
      dead: false
    })))
    
    startObstacleFall()
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

      // 착지
      setTimeout(() => {
        setCharacters(prevChars => 
          prevChars.map(char => 
            char.id === character.id 
              ? { ...char, position: { ...char.position, y: 0 } }
              : char
          )
        )
      }, 300)

      // 점프 종료
      setTimeout(() => {
        setCharacters(prevChars => 
          prevChars.map(char => 
            char.id === character.id 
              ? { ...char, isJumping: false }
              : char
          )
        )
      }, 600)

      // 다음 점프 예약 (1초 ~ 2.5초 사이)
      const nextJumpTime = 1000 + Math.random() * 1500
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
    
    obstacleIntervalRef.current = setInterval(() => {
      if (!gameFieldRef.current) return
      
      const obstacle = document.createElement('div')
      obstacle.className = 'obstacle'
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
            setWinner(updated[0].name)
          }
          
          return updated
        })
        
        if (obsBottom <= 0) {
          clearInterval(checkInterval)
          obstacle.remove()
        }
      }, 100)
    }, 1500)
  }

  const resetGame = () => {
    setGameStarted(false)
    setWinner(null)
    setCharacters([])
    if (obstacleIntervalRef.current) {
      clearInterval(obstacleIntervalRef.current)
      obstacleIntervalRef.current = null
    }
  }

  const shareResults = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      alert('URL이 복사되었습니다! 친구에게 붙여넣어 보내보세요.')
    } catch (e) {
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
          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
          <div id="gameField" ref={gameFieldRef} className="game-field">
            {characters.map(char => (
              <div 
                key={char.id}
                className="character"
                data-name={char.name}
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
              <h2>🏆 우승자: {winner} 🎉</h2>
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
