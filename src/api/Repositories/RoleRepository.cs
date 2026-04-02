using Api.Data;
using Api.Data.Entities;

namespace Api.Repositories
{
    public class RoleRepository(AppDbContext db) : BaseRepository<Role>(db), IRoleRepository
    {
    }
}
