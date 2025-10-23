include("simple.jl")
using Genie, Genie.Renderer.Json, Genie.Requests, HTTP
using UUIDs

instances = Dict()

route("/simulations", method = POST) do
    payload = jsonpayload()
    
    cars_per_street = get(payload, "cars_per_street", 5)

    model = initialize_model(cars_per_street)
    id = string(uuid1())
    instances[id] = model

    cars = []
    trafficLights = []
    
    for agent in allagents(model)
        if agent isa Car
            push!(cars, Dict(
                "id" => agent.id,
                "pos" => [agent.pos[1], agent.pos[2]],
                "vel" => [agent.vel[1], agent.vel[2]],
                "max_speed" => agent.max_speed
            ))
        elseif agent isa TrafficLight
            push!(trafficLights, Dict(
                "id" => agent.id,
                "pos" => [agent.pos[1], agent.pos[2]],
                "color" => string(agent.color),
                "timer" => agent.timer,
                "is_vertical" => agent.is_vertical
            ))
        end
    end
    
    json(Dict("Location" => "/simulations/$id", "cars" => cars, "trafficLights" => trafficLights))
end

route("/simulations/:id") do
    println(payload(:id))
    model = instances[payload(:id)]
    run!(model, 1)
    
    cars = []
    trafficLights = []
    
    for agent in allagents(model)
        if agent isa Car
            push!(cars, Dict(
                "id" => agent.id,
                "pos" => [agent.pos[1], agent.pos[2]],
                "vel" => [agent.vel[1], agent.vel[2]],
                "max_speed" => agent.max_speed
            ))
        elseif agent isa TrafficLight
            push!(trafficLights, Dict(
                "id" => agent.id,
                "pos" => [agent.pos[1], agent.pos[2]],
                "color" => string(agent.color),
                "timer" => agent.timer,
                "is_vertical" => agent.is_vertical
            ))
        end
    end
    
    avg_speed = calculate_average_speed(model)
    
    json(Dict("cars" => cars, "trafficLights" => trafficLights, "avgSpeed" => avg_speed))
end


Genie.config.run_as_server = true
Genie.config.cors_headers["Access-Control-Allow-Origin"] = "*"
Genie.config.cors_headers["Access-Control-Allow-Headers"] = "Content-Type"
Genie.config.cors_headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS" 
Genie.config.cors_allowed_origins = ["*"]

up()