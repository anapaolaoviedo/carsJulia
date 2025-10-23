import { useState, useRef } from 'react';

export default function App() {
  let [location, setLocation] = useState("");
  let [trafficLights, setTrafficLights] = useState([]);
  let [cars, setCars] = useState([]);  // Descomentado para Pregunta 2
  let [simSpeed, setSimSpeed] = useState(10);
  const running = useRef(null);

 
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 20;
  const SCALE = CANVAS_WIDTH / GRID_SIZE;

  // Colores
  const LIGHT_COLORS = {
    green: '#00FF00',
    yellow: '#FFFF00',
    red: '#FF0000',
  };

  let setup = () => {
    console.log("Iniciando simulación con auto y semáforos...");
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]);
      setTrafficLights(data["trafficLights"] || []);
      setCars(data["cars"] || []);
    });
  }

  const handleStart = () => {
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setTrafficLights(data["trafficLights"] || []);
        setCars(data["cars"] || []);
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simulación de Cruce - Pregunta 2</h1>
      <p style={{ color: '#666' }}>Un auto que se detiene ante semáforos en amarillo/rojo</p>
      
      {/* Controles */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={setup} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Setup
        </button>
        <button onClick={handleStart} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Start
        </button>
        <button onClick={handleStop} style={{ padding: '8px 16px' }}>
          Stop
        </button>
      </div>

      {/* Canvas del cruce */}
      <svg 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ backgroundColor: "#90EE90", border: "2px solid black" }}
      >
        {/* Calle horizontal */}
        <rect 
          x={0} 
          y={(GRID_SIZE/2 - 2) * SCALE} 
          width={CANVAS_WIDTH} 
          height={4 * SCALE} 
          style={{ fill: "#555555" }}
        />
        
        {/*  divisoria horizontal */}
        <line 
          x1={0} 
          y1={GRID_SIZE/2 * SCALE} 
          x2={CANVAS_WIDTH} 
          y2={GRID_SIZE/2 * SCALE} 
          stroke="yellow" 
          strokeWidth="3" 
          strokeDasharray="15,10"
        />
        
        {/* Calle vertical */}
        <rect 
          x={(GRID_SIZE/2 - 2) * SCALE} 
          y={0} 
          width={4 * SCALE} 
          height={CANVAS_HEIGHT} 
          style={{ fill: "#555555" }}
        />
        
        {/*  divisoria vertical */}
        <line 
          x1={GRID_SIZE/2 * SCALE} 
          y1={0} 
          x2={GRID_SIZE/2 * SCALE} 
          y2={CANVAS_HEIGHT} 
          stroke="yellow" 
          strokeWidth="3" 
          strokeDasharray="15,10"
        />

        {/* sem */}
        {trafficLights.map(light => {
          const x = light.pos[0] * SCALE;
          const y = light.pos[1] * SCALE;
          
          return (
            <g key={light.id}>
              {/* Poste */}
              <rect
                x={x - 6}
                y={y - 10}
                width={12}
                height={40}
                fill="#333333"
                stroke="black"
                strokeWidth="1"
              />
              
              {/* Caja */}
              <rect
                x={x - 10}
                y={y - 8}
                width={20}
                height={28}
                fill="#222222"
                stroke="black"
                strokeWidth="2"
                rx="3"
              />
              
              {/* Luz */}
              <circle
                cx={x}
                cy={y + 5}
                r={8}
                fill={LIGHT_COLORS[light.color] || '#888888'}
                stroke="#000000"
                strokeWidth={2}
              />
              
              {/* Temporizador */}
              <text
                x={x}
                y={y + 40}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="black"
              >
                {light.timer}
              </text>
              
              {/* Dirección */}
              <text
                x={x}
                y={y + 54}
                textAnchor="middle"
                fontSize="10"
                fill="black"
              >
                {light.is_vertical ? "V" : "H"}
              </text>
            </g>
          );
        })}

        {/* Autos - NUEVO para Pregunta 2 */}
        {cars.map(car => {
          const x = car.pos[0] * SCALE;
          const y = car.pos[1] * SCALE;
          const isMoving = car.vel[0] > 0 || car.vel[1] > 0;
          
          return (
            <g key={car.id}>
              {/* Cuerpo del auto */}
              <rect
                x={x - 12}
                y={y - 8}
                width={24}
                height={16}
                fill={isMoving ? "#FF4444" : "#888888"}
                stroke="black"
                strokeWidth="2"
                rx="2"
              />
              
              {/* Ventanas */}
              <rect
                x={x - 8}
                y={y - 5}
                width={8}
                height={10}
                fill="#87CEEB"
                stroke="black"
                strokeWidth="1"
              />
              
              {/* Indicador de estado */}
              <circle
                cx={x}
                cy={y}
                r={3}
                fill={isMoving ? "#00FF00" : "#FF0000"}
              />
              
              {/* ID del auto */}
              <text
                x={x}
                y={y + 25}
                textAnchor="middle"
                fontSize="10"
                fill="black"
              >
                ID:{car.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Panel de información */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        
        {/* Información de semáforos */}
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          border: '1px solid #ccc', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '5px' 
        }}>
          <h3>🚦 Semáforos:</h3>
          {trafficLights.length > 0 ? (
            trafficLights.map(light => (
              <div key={light.id} style={{ marginBottom: '10px', fontSize: '14px' }}>
                <strong>{light.is_vertical ? 'Vertical:' : 'Horizontal:'}</strong>
                <span style={{ 
                  color: LIGHT_COLORS[light.color],
                  fontWeight: 'bold',
                  marginLeft: '10px',
                  padding: '2px 8px',
                  backgroundColor: '#000',
                  borderRadius: '3px'
                }}>
                  {light.color ? light.color.toUpperCase() : 'N/A'}
                </span>
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  (T: {light.timer})
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Sin datos</p>
          )}
        </div>

        {/* Información de autos */}
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          border: '1px solid #ccc', 
          backgroundColor: '#fff9f0', 
          borderRadius: '5px' 
        }}>
          <h3> Auto:</h3>
          {cars.length > 0 ? (
            cars.map(car => {
              const isMoving = car.vel[0] > 0 || car.vel[1] > 0;
              return (
                <div key={car.id} style={{ marginBottom: '10px', fontSize: '14px' }}>
                  <strong>ID {car.id}:</strong>
                  <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                    <div>Posición: ({car.pos[0].toFixed(2)}, {car.pos[1].toFixed(2)})</div>
                    <div>Velocidad: {car.vel[0].toFixed(2)}</div>
                    <div>
                      Estado: 
                      <span style={{ 
                        fontWeight: 'bold',
                        color: isMoving ? '#00AA00' : '#AA0000',
                        marginLeft: '5px'
                      }}>
                        {isMoving ? ' MOVIENDO' : ' DETENIDO'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Sin datos</p>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        border: '1px solid #ccc', 
        backgroundColor: '#fffef0',
        borderRadius: '5px'
      }}>
        <h4>Comportamiento:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>El auto se mueve horizontalmente de izquierda a derecha</li>
          <li>Se detiene cuando el semáforo horizontal está en AMARILLO o ROJO</li>
          <li>Continúa cuando el semáforo está en VERDE</li>
          <li>Color rojo del auto = detenido, Color rojo brillante = moviendo</li>
        </ul>
      </div>
    </div>
  );
}