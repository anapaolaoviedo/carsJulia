include("simple.jl")
using Genie, Genie.Renderer.Json, Genie.Requests, HTTP
using UUIDs

instances = Dict()

route("/simulations", method = POST) do
    payload = jsonpayload()

    model = initialize_model()
    id = string(uuid1())
    instances[id] = model

    cars = []
    trafficLights = []
    
    for agent in allagents(model)
        if agent isa Car
            push!(cars, Dict(
                "id" => agent.id,
                "pos" => [agent.pos[1], agent.pos[2]],
                "vel" => [agent.vel[1], agent.vel[2]]
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
                "vel" => [agent.vel[1], agent.vel[2]]
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
    
    json(Dict("cars" => cars, "trafficLights" => trafficLights))
end


Genie.config.run_as_server = true
Genie.config.cors_headers["Access-Control-Allow-Origin"] = "*"
Genie.config.cors_headers["Access-Control-Allow-Headers"] = "Content-Type"
Genie.config.cors_headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS" 
Genie.config.cors_allowed_origins = ["*"]

up()