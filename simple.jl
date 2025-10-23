using Agents, Random
using StaticArrays: SVector
using Distributions


@agent struct Car(ContinuousAgent{2,Float64})
    accelerating::Bool = true
end


@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::Symbol = :green  # :green, :yellow, :red
    timer::Int = 0
    is_vertical::Bool = false
end


const GREEN_TIME = 10
const YELLOW_TIME = 4
const RED_TIME = 14

const CAR_SPEED = 0.5  
const STOP_DISTANCE = 2.0  


function change_light_color!(light::TrafficLight)
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
    light.timer += 1
    
    if light.color == :green && light.timer >= GREEN_TIME
        change_light_color!(light)
    elseif light.color == :yellow && light.timer >= YELLOW_TIME
        change_light_color!(light)
    elseif light.color == :red && light.timer >= RED_TIME
        change_light_color!(light)
    end
end


function find_traffic_light_ahead(car::Car, model)
    """Busca si hay un semáforo adelante del auto"""
    for agent in allagents(model)
        if agent isa TrafficLight && !agent.is_vertical
            
            if agent.pos[1] > car.pos[1] && 
               abs(agent.pos[2] - car.pos[2]) < 1.0 &&  
               agent.pos[1] - car.pos[1] < STOP_DISTANCE  
                return agent
            end
        end
    end
    return nothing
end

function should_stop(car::Car, model)
    """Determina si el auto debe detenerse"""
    light = find_traffic_light_ahead(car, model)
    
    if light !== nothing
        if light.color == :yellow || light.color == :red
            return true
        end
    end
    
    return false
end

function car_step!(car::Car, model)
    """Actualiza el movimiento del auto"""
    if should_stop(car, model)
        car.vel = (0.0, 0.0)
    else
        car.vel = (CAR_SPEED, 0.0)
    end
    
    move_agent!(car, model, 1.0)
end


function agent_step!(agent::TrafficLight, model)
    trafficlight_step!(agent, model)
end

function agent_step!(agent::Car, model)
    car_step!(agent, model)
end


function initialize_model(extent = (20, 20))
    space2d = ContinuousSpace(extent; spacing = 0.5, periodic = true)
    rng = Random.MersenneTwister()
    
   
    model = StandardABM(
        Union{Car, TrafficLight}, 
        space2d; 
        rng, 
        agent_step!, 
        scheduler = Schedulers.ByType(true, true, TrafficLight, Car)
    )
    
    center_x = extent[1] / 2
    center_y = extent[2] / 2
    
    
    add_agent!(
        TrafficLight,
        SVector{2, Float64}(center_x - 2, center_y), 
        model;
        vel = SVector{2, Float64}(0.0, 0.0),
        color = :green,
        timer = 0,
        is_vertical = false
    )
    
    add_agent!(
        TrafficLight,
        SVector{2, Float64}(center_x, center_y + 2), 
        model;
        vel = SVector{2, Float64}(0.0, 0.0),
        color = :red,
        timer = 0,
        is_vertical = true
    )
    

    if rand() < 0.5
        car_x = rand(Uniform(2.0, center_x - 4))
    else
       
        car_x = rand(Uniform(2.0, center_x - 4))
    end
    
    car_y = center_y  
    
    add_agent!(
        Car,
        SVector{2, Float64}(car_x, car_y),
        model;
        vel = SVector{2, Float64}(CAR_SPEED, 0.0),
        accelerating = true
    )
    
    model
end



println("=== SIMULACIÓN CON UN AUTO Y SEMÁFOROS (Pregunta 2) ===\n")
println("Configuración:")
println("  - Espacio: 20x20 (cuadrado)")
println("  - 1 auto en calle horizontal")
println("  - Auto se detiene ante semáforo amarillo/rojo")
println("  - Scheduler: ByType (semáforos primero, luego autos)\n")

model = initialize_model()

for i in 0:50
    println("--- Paso $i ---")
    
    for agent in allagents(model)
        if agent isa TrafficLight
            direction = agent.is_vertical ? "VERTICAL  " : "HORIZONTAL"
            color_name = agent.color == :green ? "VERDE   " : 
                        agent.color == :yellow ? "AMARILLO" : "ROJO    "
            println("  Semáforo $direction: $color_name (tiempo: $(agent.timer))")
        end
    end
    
    for agent in allagents(model)
        if agent isa Car
            status = agent.vel[1] > 0 ? "MOVIENDO" : "DETENIDO"
            println("  Auto (id: $(agent.id)): pos=($(round(agent.pos[1], digits=2)), $(round(agent.pos[2], digits=2))), vel=$(round(agent.vel[1], digits=2)) [$status]")
        end
    end
    
    println()
    
    if i < 50
        step!(model, 1)
    end
end

