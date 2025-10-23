using Agents, Random
using StaticArrays: SVector
using Distributions



@agent struct Car(ContinuousAgent{2,Float64})
    accelerating::Bool = true
end

@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::Symbol = :green  # 
    timer::Int = 0  
    is_vertical::Bool = true
end

const GREEN_TIME = 10   
const YELLOW_TIME = 4   
const RED_TIME = 14     



function change_light_color!(light::TrafficLight)
    """Cambia el semáforo al siguiente color en el ciclo"""
    if light.color == :green
        light.color = :yellow
        light.timer = 0
    elseif light.color == :yellow
        light.color = :red
        light.timer = 0
    elseif light.color == :red
        light.color = :green
        light.timer = 0
    end
end

function trafficlight_step!(light::TrafficLight, model)
    """Actualiza el estado del semáforo"""
    light.timer += 1
    
    if light.color == :green && light.timer >= GREEN_TIME
        change_light_color!(light)
    elseif light.color == :yellow && light.timer >= YELLOW_TIME
        change_light_color!(light)
    elseif light.color == :red && light.timer >= RED_TIME
        change_light_color!(light)
    end
end


function agent_step!(agent::TrafficLight, model)
    trafficlight_step!(agent, model)
end


function initialize_model(extent = (20, 20))  
    space2d = ContinuousSpace(extent; spacing = 0.5, periodic = false)
    rng = Random.MersenneTwister()
    
 
    model = StandardABM(
        TrafficLight, 
        space2d; 
        rng, 
        agent_step!, 
        scheduler = Schedulers.ByID()  
    )
    
    center_x = extent[1] / 2
    center_y = extent[2] / 2
    
   
    add_agent!(
        SVector{2, Float64}(center_x - 2, center_y), 
        model;
        vel = SVector{2, Float64}(0.0, 0.0),
        color = :green,
        timer = 0,
        is_vertical = false
    )
    
 
    add_agent!(
        SVector{2, Float64}(center_x, center_y + 2), 
        model;
        vel = SVector{2, Float64}(0.0, 0.0),
        color = :red,
        timer = 0,
        is_vertical = true
    )
    
  
    
    model
end


println("=== SIMULACIÓN DE SEMÁFOROS SINCRONIZADOS (Pregunta 1) ===\n")
println("Configuración:")
println("  - Espacio: 20x20 (cuadrado)")
println("  - Verde: $GREEN_TIME pasos")
println("  - Amarillo: $YELLOW_TIME pasos")
println("  - Rojo: $RED_TIME pasos")
println("  - Semáforos sincronizados\n")

model = initialize_model()

for i in 0:30
    println("--- Paso $i ---")
    
    for agent in allagents(model)
        direction = agent.is_vertical ? "VERTICAL  " : "HORIZONTAL"
        color_name = agent.color == :green ? "VERDE   " : 
                    agent.color == :yellow ? "AMARILLO" : "ROJO    "
        println("  Semáforo $direction: $color_name (tiempo: $(agent.timer))")
    end
    println()
    
    if i < 30
        step!(model, 1)
    end
end
