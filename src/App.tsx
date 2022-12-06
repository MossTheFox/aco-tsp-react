import ACOCanvas from './scripts/ACOCanvas';
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import ACOControlPanel from './scripts/ACOControlPanel';

function App() {

    return <Container maxWidth="lg">
            <Box my={2}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={9}>

                        <ACOCanvas />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        
                        <ACOControlPanel />

                    </Grid>

                </Grid>

            </Box>
        </Container>;
}

export default App
