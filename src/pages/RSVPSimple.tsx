import { useParams } from "react-router-dom";

const RSVPSimple = () => {
  console.log('🔥 RSVPSimple Component loaded!');
  const params = useParams();
  console.log('📋 All params:', params);
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>RSVP Simple Test Page</h1>
      <p>Params: {JSON.stringify(params)}</p>
      <p>If you see this, routing works!</p>
    </div>
  );
};

export default RSVPSimple;