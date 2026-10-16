using System.Net.Http.Json;

namespace Atelier.Studio;

public record Project(int Id, string Name, decimal Budget);

/// <summary>Reads projects from the studio API.</summary>
public sealed class StudioClient(HttpClient http)
{
    private const int PageSize = 12;

    public async Task<IReadOnlyList<Project>> GetProjectsAsync(bool includeArchived = false)
    {
        var url = $"/projects?limit={PageSize}&archived={includeArchived}";
        var projects = await http.GetFromJsonAsync<List<Project>>(url) ?? [];
        return projects.Where(p => p.Budget > 0m).ToList();
    }
}
