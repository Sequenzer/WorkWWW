#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <time.h>

#include <SDL/SDL.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

//Basic random number gen
double _rand_dist(double x) {
    return (double)rand() / RAND_MAX;
}

//Generates a Vector of n random values around x based on a propability function f.
double* generateVector(double* vector, int n, double x, double (*f)(double)) {
    for (int i = 0; i < n; i++) {
        vector[i] = x + f(x);
    }
    return vector;
}

typedef struct {
    double* vector;
    int n;
    double old;
    double (*f)(double);
} Sim;

Sim init_sim(int n, double x, double (*f)(double)) {
    Sim sim;
    sim.vector = (double*)malloc(n * sizeof(double));
    sim.vector = generateVector(sim.vector, n, x, f);
    sim.n = n;
    sim.old = x;
    sim.f = f;
    return sim;
}






int main() {
    srand(time(NULL));
    Sim sim = init_sim(10, 100, _rand_dist);

    for (int i = 0; i < sim.n; i++) {
        printf("%f\n", sim.vector[i]);
    }
    printf("hello, world!\n");

    SDL_Init(SDL_INIT_VIDEO);
    SDL_Surface *screen = SDL_SetVideoMode(256, 200, 32, SDL_SWSURFACE);

#ifdef TEST_SDL_LOCK_OPTS
    EM_ASM("SDL.defaults.copyOnLock = false; SDL.defaults.discardOnLock = true; SDL.defaults.opaqueFrontBuffer = false;");
#endif

    if (SDL_MUSTLOCK(screen)) SDL_LockSurface(screen);
    for (int i = 0; i < 256; i++) {
      for (int j = 0; j < 256; j++) {
#ifdef TEST_SDL_LOCK_OPTS
        // Alpha behaves like in the browser, so write proper opaque pixels.
        int alpha = 255;
#else
        // To emulate native behavior with blitting to screen, alpha component is ignored. Test that it is so by outputting
        // data (and testing that it does get discarded)
        int alpha = (i+j) % 255;
#endif
        *((Uint32*)screen->pixels + i * 256 + j) = SDL_MapRGBA(screen->format, i, j, 255-i, alpha);
      }
    }
    if (SDL_MUSTLOCK(screen)) SDL_UnlockSurface(screen);
    SDL_Flip(screen);

    printf("you should see a smoothly-colored square - no sharp lines but the square borders!\n");
    printf("and here is some text that should be HTML-friendly: amp: |&| double-quote: |\"| quote: |'| less-than, greater-than, html-like tags: |<cheez></cheez>|\nanother line.\n");

  SDL_Quit();
    return 0;
}

