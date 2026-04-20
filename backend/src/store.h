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
        updateLevelUnsafe();
    }

    std::string getNotes() {
        std::lock_guard<std::mutex> lock(mutex_);
        return user_.notes;
    }

    void setNotes(const std::string& notes) {
        std::lock_guard<std::mutex> lock(mutex_);
        user_.notes = notes;
    }

    int getWaterIntake() {
        std::lock_guard<std::mutex> lock(mutex_);
        return user_.waterIntake;
    }

    int getWaterGoal() {
        std::lock_guard<std::mutex> lock(mutex_);
        return user_.waterGoal;
    }

    void setWaterGoal(int goal) {
        std::lock_guard<std::mutex> lock(mutex_);
        user_.waterGoal = goal;
    }

    void incrementWaterIntake() {
        std::lock_guard<std::mutex> lock(mutex_);
        user_.waterIntake++;
        user_.xp += 5;
        updateLevelUnsafe();
    }

    void updateProfile(const std::string& name, const std::string& avatarUrl) {
        std::lock_guard<std::mutex> lock(mutex_);
        user_.name = name;
        user_.avatarUrl = avatarUrl;
    }

    std::vector<Habit> getHabits(const std::string& date) {
        std::lock_guard<std::mutex> lock(mutex_);
        return dailyHabits_[date];
    }

    void addHabit(const std::string& date, const Habit& habit) {
        std::lock_guard<std::mutex> lock(mutex_);
        dailyHabits_[date].push_back(habit);
    }

    Habit toggleHabit(const std::string& date, const std::string& id) {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& habit : dailyHabits_[date]) {
            if (habit.id == id) {
                habit.completedToday = !habit.completedToday;
                if (habit.completedToday) {
                    habit.streak++;
                    user_.xp += 10;
                } else {
                    habit.streak = std::max(0, habit.streak - 1);
                    user_.xp -= 10;
                }
                updateLevelUnsafe();
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
                updateLevelUnsafe();
                return goal;
            }
        }
        return Goal{};
    }

    bool deleteGoal(const std::string& id) {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto it = goals_.begin(); it != goals_.end(); ++it) {
            if (it->id == id) {
                int xpGained = (it->type == "weekly") ? 25 : (it->type == "monthly") ? 100 : 500;
                user_.xp += xpGained;
                updateLevelUnsafe();
                goals_.erase(it);
                return true;
            }
        }
        return false;
    }

private:
    Store() {
        // Initial Mock Data
        user_ = {150, 2, "John Doe", "", 0, 8, ""};
        
        // Mock data for today
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        char buf[100];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d", std::localtime(&in_time_t));
        std::string today(buf);

        dailyHabits_[today] = {
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

    void updateLevelUnsafe() {
        int xp = user_.xp;
        if (xp < 100) user_.level = 1;
        else if (xp < 300) user_.level = 2;
        else user_.level = ((xp - 300) / 300) + 3;
    }

    std::mutex mutex_;
    User user_;
    std::unordered_map<std::string, std::vector<Habit>> dailyHabits_;
    std::vector<Goal> goals_;
};
