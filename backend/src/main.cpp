#include "crow.h"
#include "store.h"
#include <chrono>
#include <cstdlib>
#include <sys/stat.h>

inline bool file_exists(const std::string& name) {
  struct stat buffer;   
  return (stat(name.c_str(), &buffer) == 0); 
}

struct CORS {
    struct context {};
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    void after_handle(crow::request& req, crow::response& res, context& ctx) {}
};

int main() {
    crow::App<CORS> app;
    auto& store = Store::getInstance();

    // CORS preflight
    CROW_ROUTE(app, "/api/<path>").methods(crow::HTTPMethod::OPTIONS)([](const crow::request& req, crow::response& res, std::string path) {
        res.code = 204;
        res.end();
    });

    // Profile API
    CROW_ROUTE(app, "/api/user/profile").methods("GET"_method)([&store]() {
        auto user = store.getUser();
        crow::json::wvalue x;
        x["name"] = user.name;
        x["xp"] = user.xp;
        x["level"] = user.level;
        return x;
    });

    // Habits API
    CROW_ROUTE(app, "/api/habits").methods("GET"_method)([&store](const crow::request& req) {
        std::string dateStr = req.url_params.get("date") ? req.url_params.get("date") : "";
        if (dateStr.empty()) return crow::response(400);

        auto habits = store.getHabits(dateStr);
        std::vector<crow::json::wvalue> json_habits;
        for (const auto& h : habits) {
            crow::json::wvalue x;
            x["id"] = h.id;
            x["title"] = h.title;
            x["streak"] = h.streak;
            x["completedToday"] = h.completedToday;
            x["color"] = h.color;
            json_habits.push_back(std::move(x));
        }
        return crow::response(crow::json::wvalue(json_habits));
    });

    CROW_ROUTE(app, "/api/habits").methods("POST"_method)([&store](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("title") || !x.has("dates")) return crow::response(400);
        
        std::string title = x["title"].s();
        
        // Ensure 'dates' is a list
        if (x["dates"].t() != crow::json::type::List) return crow::response(400);

        // Generate a single unique ID for this habit creation batch
        std::string newId = std::to_string(std::chrono::system_clock::now().time_since_epoch().count());

        for (const auto& dateVal : x["dates"]) {
            Habit h;
            h.id = newId; // Same ID if you want them linked, or unique per day. Let's make them unique per day to avoid ID collisions if fetched in a weird way, or keep it the same. Actually, it's safer to keep the ID unique so we can toggle them independently.
            h.title = title;
            h.streak = 0;
            h.completedToday = false;
            h.color = "#8B5CF6"; // Default or randomized
            store.addHabit(dateVal.s(), h);
        }
        
        return crow::response(201);
    });

    CROW_ROUTE(app, "/api/habits/<string>/toggle").methods("PUT"_method)([&store](const crow::request& req, std::string id) {
        std::string dateStr = req.url_params.get("date") ? req.url_params.get("date") : "";
        if (dateStr.empty()) return crow::response(400);

        auto updated = store.toggleHabit(dateStr, id);
        if (updated.id.empty()) return crow::response(404);
        
        crow::json::wvalue x;
        x["id"] = updated.id;
        x["title"] = updated.title;
        x["streak"] = updated.streak;
        x["completedToday"] = updated.completedToday;
        return crow::response(x);
    });

    // Goals API
    CROW_ROUTE(app, "/api/goals").methods("GET"_method)([&store]() {
        auto goals = store.getGoals();
        std::vector<crow::json::wvalue> json_goals;
        for (const auto& g : goals) {
            crow::json::wvalue x;
            x["id"] = g.id;
            x["title"] = g.title;
            x["completed"] = g.completed;
            x["type"] = g.type;
            json_goals.push_back(std::move(x));
        }
        return crow::json::wvalue(json_goals);
    });

    CROW_ROUTE(app, "/api/goals").methods("POST"_method)([&store](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("title") || !x.has("type")) return crow::response(400);
        
        Goal g;
        g.id = std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
        g.title = x["title"].s();
        g.type = x["type"].s();
        g.completed = false;
        
        store.addGoal(g);
        return crow::response(201);
    });

    CROW_ROUTE(app, "/api/goals/<string>/toggle").methods("PUT"_method)([&store](std::string id) {
        auto updated = store.toggleGoal(id);
        if (updated.id.empty()) return crow::response(404);
        
        crow::json::wvalue x;
        x["id"] = updated.id;
        x["completed"] = updated.completed;
        return crow::response(x);
    });

    CROW_ROUTE(app, "/api/goals/<string>").methods(crow::HTTPMethod::DELETE)([](const std::string& id) {
        if (Store::getInstance().deleteGoal(id)) {
            return crow::response(200);
        }
        return crow::response(404);
    });

    CROW_ROUTE(app, "/api/notes").methods(crow::HTTPMethod::GET)([]() {
        crow::json::wvalue x;
        x["notes"] = Store::getInstance().getNotes();
        return crow::response(x);
    });

    CROW_ROUTE(app, "/api/notes").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body || !body.has("notes")) return crow::response(400);
        Store::getInstance().setNotes(body["notes"].s());
        return crow::response(200);
    });

    CROW_ROUTE(app, "/api/health").methods(crow::HTTPMethod::GET)([]() {
        crow::json::wvalue x;
        x["waterIntake"] = Store::getInstance().getWaterIntake();
        x["waterGoal"] = Store::getInstance().getWaterGoal();
        return crow::response(x);
    });

    CROW_ROUTE(app, "/api/health/water").methods(crow::HTTPMethod::POST)([]() {
        Store::getInstance().incrementWaterIntake();
        return crow::response(200);
    });

    CROW_ROUTE(app, "/api/health/water-goal").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body || !body.has("goal")) return crow::response(400);
        Store::getInstance().setWaterGoal(body["goal"].i());
        return crow::response(200);
    });



    CROW_ROUTE(app, "/api/user/profile").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return crow::response(400);
        std::string name = body.has("name") ? std::string(body["name"].s()) : std::string("");
        std::string avatarUrl = body.has("avatarUrl") ? std::string(body["avatarUrl"].s()) : std::string("");
        Store::getInstance().updateProfile(name, avatarUrl);
        return crow::response(200);
    });

    // Static files and SPA fallback
    CROW_CATCHALL_ROUTE(app)([](const crow::request& req) {
        std::string req_path = req.url;
        if (req_path == "/") req_path = "/index.html";
        
        std::string file_path = "dist" + req_path;
        if (file_exists(file_path)) {
            crow::response res;
            res.set_static_file_info(file_path);
            return res;
        }

        // SPA Fallback
        crow::response res;
        res.set_static_file_info("dist/index.html");
        return res;
    });

    const char* port_env = std::getenv("PORT");
    int port = port_env ? std::stoi(port_env) : 8080;

    app.port(port).multithreaded().run();
}
