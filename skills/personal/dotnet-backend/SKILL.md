---
name: dotnet-backend
description: "The engineering skills applied to a C#/.NET backend: the tight loop, the test seam, deep modules, and the OpenAPI contract a TypeScript client is generated from. Use when writing, testing, debugging or reviewing C#/.NET code, or when changing an API that a generated client consumes."
---

How `tdd`, `diagnosing-bugs`, `codebase-design` and `code-review` land in a C#/.NET codebase. The repo is the source of truth for versions and tooling: read `global.json`, `Directory.Build.props`, `Directory.Packages.props` and the test projects' package references, and match the SDK, target framework and test framework already there.

## Tight loop

One command that runs only the test in front of you:

```bash
dotnet test <path/to/Tests.csproj> --filter "FullyQualifiedName~<ClassOrMethodName>"
```

`dotnet watch test --project <path/to/Tests.csproj>` re-runs on save. Where the test project runs on Microsoft.Testing.Platform, the filter flags differ per framework: read `dotnet test --help` inside that project once and use what it lists.

The checks `code-review` leans on: `dotnet build -warnaserror` and `dotnet format --verify-no-changes`, where CI already runs them.

## Test seam

Test an HTTP API through HTTP. `WebApplicationFactory<Program>` (package `Microsoft.AspNetCore.Mvc.Testing`) boots the real pipeline in memory, so routing, model binding, validation, auth and serialization are all under test:

```csharp
public class OrdersApiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Rejects_an_order_without_lines()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/orders", new { lines = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

- A minimal-API `Program` is internal by default. Add `public partial class Program { }` at the bottom of `Program.cs` so the test project can name it.
- Replace only what leaves the process (a third-party HTTP API, a message bus, the clock) with `factory.WithWebHostBuilder(b => b.ConfigureTestServices(...))`. Everything inside the process runs for real.
- Run the database for real too, the same engine as production in a container. EF Core's in-memory provider is a different engine: no relational constraints, no real SQL translation.

Reach below HTTP only for logic with many cases and no I/O (pricing, scheduling, parsing): test that class directly through its public methods.

## Deep modules

- `internal` is the default; `public` is the interface. Every `public` type on a class library is a promise to its callers.
- A project (assembly) is the strongest seam C# offers: a reference that does not exist cannot be used. Put a module's implementation behind one small public entry point (a service interface, or an `Add<Module>(this IServiceCollection)` extension) and keep the rest `internal sealed`.
- `InternalsVisibleTo` for a test project means the test reaches around the interface. Test through the public entry point, or the HTTP seam above.

## The contract

The OpenAPI document is the seam between this backend and a generated TypeScript client. Treat it as a build artifact that is reviewed like code.

1. **Emit it at build time.** With the built-in generator (`Microsoft.AspNetCore.OpenApi`, .NET 9 and later), add `Microsoft.Extensions.ApiDescription.Server` and set, in the API's `.csproj`:

   ```xml
   <PropertyGroup>
     <OpenApiGenerateDocumentsOnBuild>true</OpenApiGenerateDocumentsOnBuild>
     <OpenApiDocumentsDirectory>$(MSBuildProjectDirectory)</OpenApiDocumentsDirectory>
   </PropertyGroup>
   ```

   A repo already on Swashbuckle or NSwag keeps its generator; find where it writes the document and use that file.
2. **Commit the document.** An API change then shows up as a spec diff in the same pull request, which is the reviewable form of "what did this do to the client?".
3. **Change order**: endpoint and DTOs, build, read the spec diff, regenerate the client, fix what `tsc` reports. The compiler errors are the complete migration list.

What the C# decides about the generated TypeScript:

| C# | Becomes in the client |
| --- | --- |
| `required` members, non-nullable reference types | required, non-optional properties |
| `string?`, `int?` | optional or nullable properties |
| Enums serialized as strings (`JsonStringEnumConverter`) | a string union; as numbers they arrive as bare `number` |
| The operation id (`.WithName("GetOrder")` on a minimal API) | the generated method name, so renaming one breaks every caller |

Build-time generation starts the app's entry point, so startup code runs during `dotnet build`. Guard database and secret access in startup when the build fails for that reason.

The OpenAPI version follows the SDK: 3.1 by default on .NET 10, 3.2 on .NET 11. Where the client generator rejects the document, pin the version in the same `PropertyGroup`:

```xml
<OpenApiGenerateDocumentsOptions>--openapi-version OpenApi3_0</OpenApiGenerateDocumentsOptions>
```

Source for this section: [Generate OpenAPI documents](https://learn.microsoft.com/aspnet/core/fundamentals/openapi/aspnetcore-openapi). Read it at the repo's .NET version before changing generator settings.
