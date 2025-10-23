import { useState, useRef } from 'react';

export default function App() {
  let [location, setLocation] = useState("");
  let [trafficLights, setTrafficLights] = useState([]);
  let [cars, setCars] = useState([]);
  let [avgSpeed, setAvgSpeed] = useState(0);
  let [simSpeed, setSimSpeed] = useState(10);
  let [carsPerStreet, setCarsPerStreet] = useState(5);
  const running = useRef(null);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 20;
  const SCALE = CANVAS_WIDTH / GRID_SIZE;

  const LIGHT_COLORS = {
    green: '#00FF00',
    yellow: '#FFFF00',
    red: '#FF0000',
  };

  let setup = () => {
    console.log(`Iniciando simulación con ${carsPerStreet} autos por calle...`);
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cars_per_street: carsPerStreet })
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
        setAvgSpeed(data["avgSpeed"] || 0);
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simulación Completa - Pregunta 3</h1>
      <p style={{ color: '#666' }}>Múltiples autos con aceleración/desaceleración</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>
          <label>Autos por calle: </label>
          <input 
            type="number" 
            min="1" 
            max="7" 
            value={carsPerStreet}
            onChange={(e) => setCarsPerStreet(parseInt(e.target.value))}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
        
        <button onClick={setup} style={{ padding: '8px 16px' }}>
          Setup
        </button>
        <button onClick={handleStart} style={{ padding: '8px 16px' }}>
          Start
        </button>
        <button onClick={handleStop} style={{ padding: '8px 16px' }}>
          Stop
        </button>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '5px',
        border: '2px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 Velocidad Promedio: {avgSpeed.toFixed(3)}</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total de autos: {cars.length} | Semáforos: {trafficLights.length}
        </div>
      </div>

      <svg 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ backgroundColor: "#90EE90", border: "2px solid black" }}
      >
        <rect 
          x={0} 
          y={(GRID_SIZE/2 - 2) * SCALE} 
          width={CANVAS_WIDTH} 
          height={4 * SCALE} 
          style={{ fill: "#555555" }}
        />
        
        <line 
          x1={0} 
          y1={GRID_SIZE/2 * SCALE} 
          x2={CANVAS_WIDTH} 
          y2={GRID_SIZE/2 * SCALE} 
          stroke="yellow" 
          strokeWidth="3" 
          strokeDasharray="15,10"
        />
        
        <rect 
          x={(GRID_SIZE/2 - 2) * SCALE} 
          y={0} 
          width={4 * SCALE} 
          height={CANVAS_HEIGHT} 
          style={{ fill: "#555555" }}
        />
        
        <line 
          x1={GRID_SIZE/2 * SCALE} 
          y1={0} 
          x2={GRID_SIZE/2 * SCALE} 
          y2={CANVAS_HEIGHT} 
          stroke="yellow" 
          strokeWidth="3" 
          strokeDasharray="15,10"
        />

        {trafficLights.map(light => {
          const x = light.pos[0] * SCALE;
          const y = light.pos[1] * SCALE;
          
          return (
            <g key={light.id}>
              <rect
                x={x - 6}
                y={y - 10}
                width={12}
                height={40}
                fill="#333333"
                stroke="black"
                strokeWidth="1"
              />
              
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
              
              <circle
                cx={x}
                cy={y + 5}
                r={8}
                fill={LIGHT_COLORS[light.color] || '#888888'}
                stroke="#000000"
                strokeWidth={2}
              />
              
              <text
                x={x}
                y={y + 40}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="black"
              >
                {light.timer}
              </text>
            </g>
          );
        })}

        {cars.map(car => {
          const x = car.pos[0] * SCALE;
          const y = car.pos[1] * SCALE;
          const speed = Math.sqrt(car.vel[0]**2 + car.vel[1]**2);
          const speedRatio = speed / car.max_speed;
          
          const carColor = speedRatio > 0.7 ? "#00AA00" : 
                          speedRatio > 0.3 ? "#FFA500" : 
                          speedRatio > 0.1 ? "#FF6600" : "#888888";
          
          return (
            <g key={car.id}>
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={carColor}
                stroke="black"
                strokeWidth="1.5"
              />
              
              <circle
                cx={x}
                cy={y}
                r={2}
                fill="white"
              />
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: '20px' }}>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          backgroundColor: '#fffef0',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <h4> Código de Colores de Autos:</h4>
          <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
            <div><span style={{ color: '#00AA00', fontWeight: 'bold' }}>●</span> Rápido (&gt;70%)</div>
            <div><span style={{ color: '#FFA500', fontWeight: 'bold' }}>●</span> Medio (30-70%)</div>
            <div><span style={{ color: '#FF6600', fontWeight: 'bold' }}>●</span> Lento (10-30%)</div>
            <div><span style={{ color: '#888888', fontWeight: 'bold' }}>●</span> Detenido (&lt;10%)</div>
          </div>
        </div>

        <div style={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          backgroundColor: '#f0f8ff',
          borderRadius: '5px'
        }}>
          <h4>Comportamiento del Sistema:</h4>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '14px' }}>
            <li>Los autos aceleran cuando no hay obstáculos adelante</li>
            <li>Desaceleran cuando detectan otro auto cerca</li>
            <li>Se detienen ante semáforos en amarillo o rojo</li>
            <li>Cada auto tiene velocidad máxima aleatoria (0.8 - 1.2)</li>
            <li>Velocidad inicial aleatoria (0.3 - 0.8)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}