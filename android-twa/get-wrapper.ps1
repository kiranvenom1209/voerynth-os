# Download gradle-wrapper.jar from the official Gradle repo on GitHub
$url = "https://raw.githubusercontent.com/gradle/gradle/v8.11.1/gradle/wrapper/gradle-wrapper.jar"
$outPath = "gradle\wrapper\gradle-wrapper.jar"

Write-Host "Downloading gradle-wrapper.jar from Gradle GitHub..."
Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
$size = (Get-Item $outPath).Length
Write-Host "Downloaded: $outPath ($size bytes)"

