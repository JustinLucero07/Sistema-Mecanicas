FROM postgres:16-alpine
RUN apk add --no-cache rclone bash tzdata
ENV TZ=America/Guayaquil
COPY respaldar.sh restaurar.sh programar.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh
CMD ["programar.sh"]
