# Use the Official Bun image
FROM oven/bun:1.1.13 as base

# Set the working directory
WORKDIR /usr/src/app

# Install dependencies into temp directory
# this will cache them and speed up future builds
FROM base as install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set the production environment
ENV NODE_ENV=production

# Run tests and build
RUN bun test
RUN bun run build

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts .
COPY --from=prerelease /usr/src/app/package.json .

# Expose the port
EXPOSE 3000

# Run the application
ENTRYPOINT [ "bun", "start" ]