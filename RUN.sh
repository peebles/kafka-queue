docker run -d --name zookeeper -p 2181:2181 jplock/zookeeper:3.4.6
MACHINE_IP=$(basename $DOCKER_HOST|awk -F: '{print $1}')
docker run -d --name kafka --link zookeeper:zookeeper --env KAFKA_ADVERTISED_HOST_NAME=$MACHINE_IP  --publish 9092:9092 ches/kafka

echo "waiting 5 seconds for brokers to come up ..."
sleep 5

# Use the running container to create topics.  auto-create is on, but the default partition count is 1.
# JMX_PORT= to avoid a port conflict exception when using the running container.
docker exec -it kafka env JMX_PORT= kafka-topics.sh --create --topic prod --replication-factor 1 --partitions 2 --zookeeper zookeeper:2181
docker exec -it kafka env JMX_PORT= kafka-topics.sh --create --topic staging --replication-factor 1 --partitions 2 --zookeeper zookeeper:2181
docker exec -it kafka env JMX_PORT= kafka-topics.sh --create --topic ingest --replication-factor 1 --partitions 2 --zookeeper zookeeper:2181

