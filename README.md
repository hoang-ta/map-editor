docker build -t deck-demo-image .

docker run --name deck-demo-container -p 3000:3000 -d deck-demo-image
