docker run -d --name zookeeper -p 2181:2181 jplock/zookeeper:3.4.6
docker run -d --name kafka --link zookeeper:zookeeper --env KAFKA_ADVERTISED_HOST_NAME=192.168.99.103  --publish 9092:9092 --publish 7203:7203 ches/kafka

ZK_IP=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' zookeeper)
KAFKA_IP=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' kafka)

echo "waiting 5 seconds for brokers to come up ..."
sleep 5

docker run --rm ches/kafka kafka-topics.sh --create --topic prod --replication-factor 1 --partitions 2 --zookeeper $ZK_IP:2181
docker run --rm ches/kafka kafka-topics.sh --create --topic staging --replication-factor 1 --partitions 2 --zookeeper $ZK_IP:2181
docker run --rm ches/kafka kafka-topics.sh --create --topic ingest --replication-factor 1 --partitions 2 --zookeeper $ZK_IP:2181

