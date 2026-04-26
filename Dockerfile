FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ParkingManagementSystem.csproj .
RUN dotnet restore ParkingManagementSystem.csproj

COPY . .
RUN dotnet publish ParkingManagementSystem.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ParkingManagementSystem.dll"]
