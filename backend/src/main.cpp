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
    CROW_ROUTE(app, "/api/habits").methods("GET"_method)([&store]() {
        auto habits = store.getHabits();
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
        return crow::json::wvalue(json_habits);
    });

    CROW_ROUTE(app, "/api/habits").methods("POST"_method)([&store](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("title")) return crow::response(400);
        
        Habit h;
        h.id = std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
        h.title = x["title"].s();
        h.streak = 0;
        h.completedToday = false;
        h.color = "#8B5CF6"; // Default or randomized
        
        store.addHabit(h);
        return crow::response(201);
    });

    CROW_ROUTE(app, "/api/habits/<string>/toggle").methods("PUT"_method)([&store](std::string id) {
        auto updated = store.toggleHabit(id);
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
