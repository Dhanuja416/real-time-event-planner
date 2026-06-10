# Multi-stage production build for .NET 9 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy all source files and build release binaries
COPY . ./
RUN dotnet publish -c Release -o out

# Build production runtime container image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build-env /app/out .

# Run as non-root user for production container security hardening
USER $APP_UID

# Expose port 8080 (ASP.NET Core 9.0 default container port)
EXPOSE 8080

ENTRYPOINT ["dotnet", "RealTime.API.dll"]
