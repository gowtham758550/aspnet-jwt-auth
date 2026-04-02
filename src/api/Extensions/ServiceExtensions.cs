using Api.Data;
using Api.Repositories;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddBusinessService(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddScoped<TokenService>();
            serviceCollection.AddScoped<AccountService>();
            serviceCollection.AddScoped<AdminService>();
            return serviceCollection;
        }

        public static IServiceCollection AddPersistance(this IServiceCollection serviceCollection, IConfiguration configuration)
        {

            serviceCollection.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(configuration.GetConnectionString("Default")));
            serviceCollection.AddScoped<IUserRepository, UserRepository>();
            serviceCollection.AddScoped<IRoleRepository, RoleRepository>();

            return serviceCollection;
        }
    }
}
