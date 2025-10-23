import { useState, useRef } from 'react';

export default function App() {
  let [location, setLocation] = useState("");
  let [trafficLights, setTrafficLights] = useState([]);
  // let [cars, setCars] = useState([]); // Comentado para Pregunta 1
  let [simSpeed, setSimSpeed] = useState(10);
  const running = useRef(null);

  // Constantes para el canvas
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 20; // Tamaño del espacio en Julia
  const SCALE = CANVAS_WIDTH / GRID_SIZE; // Escala: 30 pixels por unidad

  // Colores 
  const LIGHT_COLORS = {
    green: '#00FF00',
    yellow: '#FFFF00',
    red: '#FF0000',
  };

  let setup = () => {
    console.log("Iniciando simulación de semáforos...");
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]);
      setTrafficLights(data["trafficLights"] || []);
      // setCars(data["cars"] || []); // Comentado para Pregunta 1
    });
  }

  const handleStart = () => {
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setTrafficLights(data["trafficLights"] || []);
        // setCars(data["cars"] || []); // Comentado para Pregunta 1
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  const handleSimSpeedSliderChange = (event, newValue) => {
    setSimSpeed(newValue);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simulación de Cruce con Semáforos</h1>
      
      {/* Controles */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={setup} style={{ marginRight: '10px' }}>
          Setup
        </button>
        <button onClick={handleStart} style={{ marginRight: '10px' }}>
          Start
        </button>
        <button onClick={handleStop}>
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
        
        {/*  divisoria horizontal (amarilla discontinua) */}
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
        
        {/*  divisoria vertical (amarilla discontinua) */}
        <line 
          x1={GRID_SIZE/2 * SCALE} 
          y1={0} 
          x2={GRID_SIZE/2 * SCALE} 
          y2={CANVAS_HEIGHT} 
          stroke="yellow" 
          strokeWidth="3" 
          strokeDasharray="15,10"
        />

        {/* dem */}
        {trafficLights.map(light => {
          const x = light.pos[0] * SCALE;
          const y = light.pos[1] * SCALE;
          
          return (
            <g key={light.id}>
              {/* Poste del semáforo */}
              <rect
                x={x - 6}
                y={y - 10}
                width={12}
                height={40}
                fill="#333333"
                stroke="black"
                strokeWidth="1"
              />
              
              {/* Caja del sem */}
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
              
              {/* Luz del semáforo */}
              <circle
                cx={x}
                cy={y + 5}
                r={8}
                fill={LIGHT_COLORS[light.color] || '#888888'}
                stroke="#000000"
                strokeWidth={2}
              />
              
              {/* Etiqueta con tiempo */}
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
              
              {/* Etiqueta de dirección */}
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

        {/* Autos (COMENTADO PARA PREGUNTA 1) */}
        {/* {
          cars.map(car =>
            <image 
              key={car.id} 
              id={car.id} 
              x={car.pos[0] * SCALE - 16} 
              y={car.pos[1] * SCALE - 16} 
              width={32} 
              height={32}
              href="./racing-car.png"
            />
          )
        } */}
      </svg>

      {/* Información de los semáforos */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Estado de los Semáforos:</h3>
        {trafficLights.length > 0 ? (
          trafficLights.map(light => (
            <div key={light.id} style={{ marginBottom: '10px', fontSize: '14px' }}>
              <strong>{light.is_vertical ? '🚦 Vertical:' : '🚦 Horizontal:'}</strong>
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
                (Tiempo: {light.timer})
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Presiona "Setup" para inicializar la simulación
          </p>
        )}
      </div>

      {/* Leyenda */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        border: '1px solid #ccc', 
        backgroundColor: '#fffef0',
        borderRadius: '5px'
      }}>
        <h4>⏱️ Tiempos de Semáforo:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><span style={{ color: LIGHT_COLORS.green, fontWeight: 'bold' }}>Verde:</span> 10 pasos de simulación</li>
          <li><span style={{ color: LIGHT_COLORS.yellow, fontWeight: 'bold' }}>Amarillo:</span> 4 pasos de simulación</li>
          <li><span style={{ color: LIGHT_COLORS.red, fontWeight: 'bold' }}>Rojo:</span> 14 pasos de simulación</li>
        </ul>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          <strong>Nota:</strong> Los semáforos están sincronizados. Cuando uno está en verde, el otro está en rojo.
        </p>
      </div>
    </div>
  );
}