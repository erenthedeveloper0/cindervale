#include <algorithm>
#include <string>
#include <vector>

#define MAX_HOURS 40

namespace studio {

template <typename T>
struct Entry {
    std::string project;
    T hours;
};

// Sum every entry for a single project.
template <typename T>
T total(const std::vector<Entry<T>>& entries, const std::string& project) {
    T sum{};
    for (const auto& entry : entries) {
        if (entry.project == project) sum += entry.hours;
    }
    return sum;
}

}  // namespace studio

int main() {
    std::vector<studio::Entry<double>> entries{{"atelier", 6.5}, {"atelier", 7.25}};
    auto* first = entries.empty() ? nullptr : &entries.front();
    return studio::total(entries, "atelier") > MAX_HOURS ? 1 : 0;
}
