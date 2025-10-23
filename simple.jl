using Agents, Random
using StaticArrays: SVector
using Distributions

@agent struct Car(ContinuousAgent{2,Float64})
    accelerating::Bool = true
    max_speed::Float64 = 1.0
end

@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::Symbol = :green
    timer::Int = 0
    is_vertical::Bool = false
end

const GREEN_TIME = 10
const YELLOW_TIME = 4
const RED_TIME = 14

const ACCELERATION = 0.05
const DECELERATION = 0.1
const MIN_SPEED = 0.0
const STOP_DISTANCE = 2.5
const CAR_DETECTION_DISTANCE = 1.5

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
    car_on_horizontal = abs(car.pos[2] - 10.0) < 1.0
    car_on_vertical = abs(car.pos[1] - 10.0) < 1.0
    
    for agent in allagents(model)
        if agent isa TrafficLight
            if car_on_horizontal && !agent.is_vertical
                if agent.pos[1] > car.pos[1] && 
                   abs(agent.pos[2] - car.pos[2]) < 1.0 &&
                   agent.pos[1] - car.pos[1] < STOP_DISTANCE
                    return agent
                end
            elseif car_on_vertical && agent.is_vertical
                if agent.pos[2] > car.pos[2] && 
                   abs(agent.pos[1] - car.pos[1]) < 1.0 &&
                   agent.pos[2] - car.pos[2] < STOP_DISTANCE
                    return agent
                end
            end
        end
    end
    return nothing
end

function find_car_ahead(car::Car, model)
    car_on_horizontal = abs(car.pos[2] - 10.0) < 1.0
    car_on_vertical = abs(car.pos[1] - 10.0) < 1.0
    
    for agent in allagents(model)
        if agent isa Car && agent.id != car.id
            if car_on_horizontal && abs(agent.pos[2] - car.pos[2]) < 1.0
                if agent.pos[1] > car.pos[1] && 
                   agent.pos[1] - car.pos[1] < CAR_DETECTION_DISTANCE
                    return agent
                end
            elseif car_on_vertical && abs(agent.pos[1] - car.pos[1]) < 1.0
                if agent.pos[2] > car.pos[2] && 
                   agent.pos[2] - car.pos[2] < CAR_DETECTION_DISTANCE
                    return agent
                end
            end
        end
    end
    return nothing
end

function should_stop_for_light(car::Car, model)
    light = find_traffic_light_ahead(car, model)
    
    if light !== nothing
        if light.color == :yellow || light.color == :red
            return true
        end
    end
    
    return false
end

function should_decelerate(car::Car, model)
    if should_stop_for_light(car, model)
        return true
    end
    
    car_ahead = find_car_ahead(car, model)
    if car_ahead !== nothing
        return true
    end
    
    return false
end

function car_step!(car::Car, model)
    current_speed = sqrt(car.vel[1]^2 + car.vel[2]^2)
    
    if should_decelerate(car, model)
        new_speed = max(MIN_SPEED, current_speed - DECELERATION)
        car.accelerating = false
    else
        new_speed = min(car.max_speed, current_speed + ACCELERATION)
        car.accelerating = true
    end
    
    if abs(car.vel[1]) > abs(car.vel[2])
        direction = sign(car.vel[1])
        car.vel = (new_speed * direction, 0.0)
    else
        direction = sign(car.vel[2])
        car.vel = (0.0, new_speed * direction)
    end
    
    move_agent!(car, model, 1.0)
end

function agent_step!(agent::TrafficLight, model)
    trafficlight_step!(agent, model)
end

function agent_step!(agent::Car, model)
    car_step!(agent, model)
end

function initialize_model(cars_per_street = 5, extent = (20, 20))
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
    
    for i in 1:cars_per_street
        car_x = 2.0 + (i - 1) * ((center_x - 5) / cars_per_street)
        car_y = center_y
        initial_speed = rand(Uniform(0.3, 0.8))
        max_speed = rand(Uniform(0.8, 1.2))
        
        add_agent!(
            Car,
            SVector{2, Float64}(car_x, car_y),
            model;
            vel = SVector{2, Float64}(initial_speed, 0.0),
            accelerating = true,
            max_speed = max_speed
        )
    end
    
    for i in 1:cars_per_street
        car_x = center_x
        car_y = 2.0 + (i - 1) * ((center_y - 5) / cars_per_street)
        initial_speed = rand(Uniform(0.3, 0.8))
        max_speed = rand(Uniform(0.8, 1.2))
        
        add_agent!(
            Car,
            SVector{2, Float64}(car_x, car_y),
            model;
            vel = SVector{2, Float64}(0.0, initial_speed),
            accelerating = true,
            max_speed = max_speed
        )
    end
    
    model
end

function calculate_average_speed(model)
    total_speed = 0.0
    car_count = 0
    
    for agent in allagents(model)
        if agent isa Car
            speed = sqrt(agent.vel[1]^2 + agent.vel[2]^2)
            total_speed += speed
            car_count += 1
        end
    end
    
    return car_count > 0 ? total_speed / car_count : 0.0
end

function run_experiment(cars_per_street, steps = 200)
    println("\n=== Experimento con $cars_per_street autos por calle ===")
    model = initialize_model(cars_per_street)
    
    speeds = Float64[]
    
    for i in 1:steps
        step!(model, 1)
        avg_speed = calculate_average_speed(model)
        push!(speeds, avg_speed)
    end
    
    overall_avg = sum(speeds) / length(speeds)
    println("Velocidad promedio: $(round(overall_avg, digits=4))")
    
    return overall_avg
end

println("=== SIMULACIÓN COMPLETA - PREGUNTA 3 ===\n")

avg_3 = run_experiment(3)
avg_5 = run_experiment(5)
avg_7 = run_experiment(7)

println("\n=== RESULTADOS FINALES ===")
println("3 autos por calle: $(round(avg_3, digits=4))")
println("5 autos por calle: $(round(avg_5, digits=4))")
println("7 autos por calle: $(round(avg_7, digits=4))")