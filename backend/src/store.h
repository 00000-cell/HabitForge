#pragma once
#include "models.h"
#include <mutex>
#include <unordered_map>
#include <vector>

class Store {
public:
    static Store& getInstance() {
        static Store instance;
        return instance;
    }

    User getUser() {
        std::lock_guard<std::mutex> lock(mutex_);
        return user_;
    }

    void addXp(int amount) {
        std::lock_guard<std::mutex> lock(mutex_);
        user_.xp += amount;
        
        // Level calculation logic
        int xp = user_.xp;
        if (xp < 100) user_.level = 1;
        else if (xp < 300) user_.level = 2;
        else user_.level = ((xp - 300) / 300) + 3;
    }

    std::vector<Habit> getHabits() {
        std::lock_guard<std::mutex> lock(mutex_);
        return habits_;
    }

    void addHabit(const Habit& habit) {
        std::lock_guard<std::mutex> lock(mutex_);
        habits_.push_back(habit);
    }

    Habit toggleHabit(const std::string& id) {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& habit : habits_) {
            if (habit.id == id) {
                habit.completedToday = !habit.completedToday;
                if (habit.completedToday) {
                    habit.streak++;
                    user_.xp += 10;
                } else {
                    habit.streak = std::max(0, habit.streak - 1);
                    user_.xp -= 10;
                }
                updateLevel();
                return habit;
            }
        }
        return Habit{};
    }

    std::vector<Goal> getGoals() {
        std::lock_guard<std::mutex> lock(mutex_);
        return goals_;
    }

    void addGoal(const Goal& goal) {
        std::lock_guard<std::mutex> lock(mutex_);
        goals_.push_back(goal);
    }

    Goal toggleGoal(const std::string& id) {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& goal : goals_) {
            if (goal.id == id) {
                goal.completed = !goal.completed;
                if (goal.completed) {
                    int xpGained = (goal.type == "weekly") ? 25 : (goal.type == "monthly") ? 100 : 500;
                    user_.xp += xpGained;
                } else {
                    int xpLost = (goal.type == "weekly") ? 25 : (goal.type == "monthly") ? 100 : 500;
                    user_.xp -= xpLost;
                }
                updateLevel();
                return goal;
            }
        }
        return Goal{};
    }

private:
    Store() {
        // Initial Mock Data
        user_ = {150, 2, "John Doe"};
        
        habits_ = {
            {"1", "Morning Workout", 12, true, "#8B5CF6"},
            {"2", "Read 20 pages", 5, false, "#3B82F6"},
            {"3", "Drink 2L Water", 21, false, "#06B6D4"}
        };

        goals_ = {
            {"1", "Complete React Course", false, "weekly"},
            {"2", "Read 4 Books", false, "monthly"},
            {"3", "Get a new job", false, "yearly"},
            {"4", "Workout 4x this week", true, "weekly"}
        };
    }

    void updateLevel() {
        int xp = user_.xp;
        if (xp < 100) user_.level = 1;
        else if (xp < 300) user_.level = 2;
        else user_.level = ((xp - 300) / 300) + 3;
    }

    std::mutex mutex_;
    User user_;
    std::vector<Habit> habits_;
    std::vector<Goal> goals_;
};
