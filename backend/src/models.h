#pragma once
#include <string>
#include <vector>

struct Habit {
    std::string id;
    std::string title;
    int streak;
    bool completedToday;
    std::string color;
};

struct Goal {
    std::string id;
    std::string title;
    bool completed;
    std::string type; // "weekly", "monthly", "yearly"
};

struct User {
    int xp;
    int level;
    std::string name;
    std::string notes;
    int waterIntake;
    std::string avatarUrl;
};
