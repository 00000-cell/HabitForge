cmake_minimum_required(VERSION 3.14)
project(HabitForgeBackend CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# Fetch Asio (Standalone)
FetchContent_Declare(
    asio
    GIT_REPOSITORY https://github.com/chriskohlhoff/asio.git
    GIT_TAG asio-1-28-0
)
FetchContent_MakeAvailable(asio)

# Fetch Crow
FetchContent_Declare(
    Crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG v1.2.0
)
set(CROW_BUILD_EXAMPLES OFF CACHE BOOL "Disable Crow examples")
set(CROW_BUILD_TESTS OFF CACHE BOOL "Disable Crow tests")
set(ASIO_INCLUDE_DIR ${asio_SOURCE_DIR}/asio/include CACHE PATH "ASIO include dir" FORCE)
FetchContent_MakeAvailable(Crow)

# Include directories
include_directories(
    ${asio_SOURCE_DIR}/asio/include
    ${crow_SOURCE_DIR}/include
)

# Backend Executable
add_executable(server src/main.cpp)
target_compile_definitions(server PRIVATE ASIO_STANDALONE)

# Find OS threads library
find_package(Threads REQUIRED)

target_link_libraries(server
    PRIVATE
    Crow::Crow
    Threads::Threads
    ws2_32
    wsock32
)
